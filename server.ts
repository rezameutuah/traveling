import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Ephemeral fallback ensures server starts cleanly in preview without secrets configured.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

interface StoredUser {
  username: string;
  displayName: string;
  salt: string;
  passwordHash: string;
  demoId: string | null;
  role: 'traveller';
  createdAt: string;
}

const DEMO_PERSONAS: Record<string, { id: string; displayName: string }> = {
  'nadia.putri': { id: 'demo-nadia', displayName: 'Nadia Putri' },
  'farhan.gayo': { id: 'demo-farhan', displayName: 'Farhan Gayo' },
  'rizal.bahari': { id: 'demo-rizal', displayName: 'Rizal Bahari' },
};

const usersByUsername = new Map<string, StoredUser>();
const activeTokenIds = new Set<string>();

function normalizeUsername(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let value = raw.trim().toLowerCase();
  if (value.endsWith('@contoh.aceh.id')) {
    value = value.slice(0, -'@contoh.aceh.id'.length);
  }
  return value;
}

function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHex: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHex, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function issueBearerToken(user: StoredUser): string {
  const jti = crypto.randomBytes(16).toString('hex');
  const payload = {
    jti,
    sub: user.username,
    displayName: user.displayName,
    demoId: user.demoId,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  activeTokenIds.add(jti);
  return `${encodedPayload}.${sig}`;
}

function verifyBearerToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (
      !parsed ||
      typeof parsed.jti !== 'string' ||
      typeof parsed.sub !== 'string' ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= Date.now() ||
      !activeTokenIds.has(parsed.jti)
    ) {
      return null;
    }
    return parsed as {
      jti: string;
      sub: string;
      displayName: string;
      demoId: string | null;
      role: 'traveller';
      exp: number;
    };
  } catch {
    return null;
  }
}

function extractBearer(req: Request): string {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

function requireBearerAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  const claims = token ? verifyBearerToken(token) : null;
  if (!claims) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.locals.authClaims = claims;
  next();
}

function toPublicUser(user: StoredUser) {
  return {
    username: user.username,
    displayName: user.displayName,
    demoId: user.demoId,
    role: user.role,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const username = normalizeUsername(req.body?.username);
    const password = req.body?.password;
    const rawDisplay = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';

    if (!isValidUsername(username)) {
      res.status(400).json({ error: 'invalid_username' });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'invalid_password' });
      return;
    }
    if (usersByUsername.has(username)) {
      res.status(409).json({ error: 'username_taken' });
      return;
    }

    const demoPersona = DEMO_PERSONAS[username] || null;
    const displayName = (rawDisplay || demoPersona?.displayName || username).slice(0, 80);
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser: StoredUser = {
      username,
      displayName,
      salt,
      passwordHash,
      demoId: demoPersona ? demoPersona.id : null,
      role: 'traveller',
      createdAt: new Date().toISOString(),
    };

    usersByUsername.set(username, newUser);
    const token = issueBearerToken(newUser);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/claim-demo', (req: Request, res: Response) => {
    const username = normalizeUsername(req.body?.username);
    const password = req.body?.password;
    const demoPersona = DEMO_PERSONAS[username];

    if (!demoPersona) {
      res.status(404).json({ error: 'demo_not_found' });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'invalid_password' });
      return;
    }
    if (usersByUsername.has(username)) {
      res.status(409).json({ error: 'already_claimed' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const demoUser: StoredUser = {
      username,
      displayName: demoPersona.displayName,
      salt,
      passwordHash,
      demoId: demoPersona.id,
      role: 'traveller',
      createdAt: new Date().toISOString(),
    };

    usersByUsername.set(username, demoUser);
    const token = issueBearerToken(demoUser);
    res.status(201).json({ token, user: toPublicUser(demoUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const username = normalizeUsername(req.body?.username);
    const password = req.body?.password;

    if (!isValidUsername(username) || !isValidPassword(password)) {
      res.status(400).json({ error: 'invalid_credentials' });
      return;
    }

    const user = usersByUsername.get(username);
    if (!user) {
      if (DEMO_PERSONAS[username]) {
        res.status(409).json({ error: 'demo_unclaimed', username });
        return;
      }
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    if (!verifyPassword(password, user.salt, user.passwordHash)) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    const token = issueBearerToken(user);
    res.json({ token, user: toPublicUser(user) });
  });

  app.get('/api/auth/me', requireBearerAuth, (_req: Request, res: Response) => {
    const claims = res.locals.authClaims as {
      sub: string;
      displayName: string;
      demoId: string | null;
      role: 'traveller';
    };
    res.json({
      user: {
        username: claims.sub,
        displayName: claims.displayName,
        demoId: claims.demoId,
        role: claims.role,
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractBearer(req);
    const claims = token ? verifyBearerToken(token) : null;
    if (claims) {
      activeTokenIds.delete(claims.jti);
    }
    res.json({ ok: true });
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Discover Aceh server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
