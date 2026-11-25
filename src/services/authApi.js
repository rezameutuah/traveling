// Bearer token kept strictly in JS memory (never localStorage or sessionStorage).
let memoryBearerToken = null;

export function getMemoryAuthToken() {
  return memoryBearerToken;
}

export function clearMemoryAuthToken() {
  memoryBearerToken = null;
}

async function postAuth(endpoint, body, useBearer = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useBearer && memoryBearerToken) {
    headers.Authorization = `Bearer ${memoryBearerToken}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'auth_request_failed');
    err.code = data?.error || 'auth_request_failed';
    err.status = res.status;
    err.username = data?.username || null;
    throw err;
  }

  if (typeof data.token === 'string') {
    memoryBearerToken = data.token;
  }
  return data;
}

export async function loginWithCredentials(username, password) {
  const data = await postAuth('/api/auth/login', { username, password });
  return data.user;
}

export async function registerWithCredentials(username, password, displayName) {
  const data = await postAuth('/api/auth/register', { username, password, displayName });
  return data.user;
}

export async function claimDemoAccountPassword(username, password) {
  const data = await postAuth('/api/auth/claim-demo', { username, password });
  return data.user;
}

export async function logoutCredentialsSession() {
  try {
    if (memoryBearerToken) {
      await postAuth('/api/auth/logout', {}, true);
    }
  } finally {
    memoryBearerToken = null;
  }
}
