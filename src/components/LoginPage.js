import { store } from '../state/store.js';
import { demoAccounts } from '../data/demoAccounts.js';
import { escapeHtml, sanitizeUrl } from '../utils/format.js';
import { getLastMainPage, navigateToPage } from '../utils/router.js';
import { showToast } from '../utils/toast.js';
import {
  signInWithGoogle,
  signInWithFirebaseEmail,
  registerWithFirebaseEmail,
  signOutUser,
} from '../services/firebase.js';
import {
  loginWithCredentials,
  registerWithCredentials,
  claimDemoAccountPassword,
  logoutCredentialsSession,
} from '../services/authApi.js';
import { openAdminModal } from './Modals.js';

let authErrorMessage = '';
let authMode = 'login'; // 'login' | 'register'
let isSubmittingAuth = false;
let showPassword = false;
let draftUsername = '';
let draftDisplayName = '';
let pendingClaimUsername = '';
let pendingClaimPassword = '';

export function navigateToLogin(show = true) {
  if (show) {
    navigateToPage('login');
  } else {
    navigateToPage(getLastMainPage());
  }
}

function mapAuthError(error, lang) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return lang === 'en'
      ? 'Sign-in was cancelled before completing.'
      : 'Proses masuk dibatalkan sebelum selesai.';
  }
  if (code === 'auth/popup-blocked') {
    return lang === 'en'
      ? 'Pop-up was blocked by the browser. Please allow pop-ups and try again.'
      : 'Pop-up diblokir oleh browser. Izinkan pop-up lalu coba lagi.';
  }
  if (code === 'auth/operation-not-allowed') {
    return store.t('credFirebaseEmailDisabled');
  }
  if (code === 'auth/email-already-in-use' || code === 'username_taken' || code === 'already_claimed') {
    return store.t('credUsernameTaken');
  }
  if (code === 'invalid_username' || code === 'auth/invalid-email') {
    return store.t('credInvalidUsername');
  }
  if (code === 'invalid_password' || code === 'auth/weak-password') {
    return store.t('credInvalidPassword');
  }
  if (
    code === 'invalid_credentials' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return store.t('credInvalidCredentials');
  }
  return lang === 'en'
    ? 'Unable to sign in right now. Please try again.'
    : 'Gagal masuk ke akun saat ini. Silakan coba lagi.';
}

async function handleGoogleSignIn() {
  authErrorMessage = '';
  pendingClaimUsername = '';
  pendingClaimPassword = '';
  isSubmittingAuth = true;
  renderLoginPage();
  try {
    await logoutCredentialsSession();
    await signInWithGoogle();
    showToast(store.t('toastLoginSuccess'));
    navigateToLogin(false);
  } catch (error) {
    authErrorMessage = mapAuthError(error, store.getState().lang);
  } finally {
    isSubmittingAuth = false;
    renderLoginPage();
  }
}

function handleDemoSignIn(identifier) {
  authErrorMessage = '';
  pendingClaimUsername = '';
  pendingClaimPassword = '';
  const signedIn = store.signInDemoAccount(identifier);
  if (!signedIn) {
    authErrorMessage = store.t('demoInvalidEmail');
    renderLoginPage();
    return;
  }
  showToast(store.t('toastDemoLoginSuccess', { name: signedIn.displayName }));
  navigateToLogin(false);
}

async function handleCredentialSubmit(usernameInput, passwordInput, displayNameInput) {
  const rawIdentifier = String(usernameInput || '').trim();
  const password = String(passwordInput || '');
  const displayName = String(displayNameInput || '').trim();
  draftUsername = rawIdentifier;
  draftDisplayName = displayName;
  authErrorMessage = '';
  pendingClaimUsername = '';
  pendingClaimPassword = '';

  const isExternalEmail =
    rawIdentifier.includes('@') && !rawIdentifier.toLowerCase().endsWith('@contoh.aceh.id');

  isSubmittingAuth = true;
  renderLoginPage();

  try {
    if (isExternalEmail) {
      await logoutCredentialsSession();
      if (authMode === 'register') {
        await registerWithFirebaseEmail(rawIdentifier, password, displayName);
      } else {
        await signInWithFirebaseEmail(rawIdentifier, password);
      }
      showToast(store.t('toastLoginSuccess'));
      navigateToLogin(false);
      return;
    }

    const user =
      authMode === 'register'
        ? await registerWithCredentials(rawIdentifier, password, displayName)
        : await loginWithCredentials(rawIdentifier, password);

    store.signInCredentialSession(user);
    showToast(store.t('toastLoginSuccess'));
    navigateToLogin(false);
  } catch (error) {
    if (error?.code === 'demo_unclaimed' && error?.username) {
      pendingClaimUsername = error.username;
      pendingClaimPassword = password;
      authErrorMessage = store.t('credDemoUnclaimed', { username: error.username });
    } else {
      authErrorMessage = mapAuthError(error, store.getState().lang);
    }
  } finally {
    isSubmittingAuth = false;
    renderLoginPage();
  }
}

async function handleClaimDemoPassword() {
  if (!pendingClaimUsername || !pendingClaimPassword) return;
  authErrorMessage = '';
  isSubmittingAuth = true;
  renderLoginPage();

  try {
    const user = await claimDemoAccountPassword(pendingClaimUsername, pendingClaimPassword);
    pendingClaimUsername = '';
    pendingClaimPassword = '';
    store.signInCredentialSession(user);
    showToast(store.t('toastDemoLoginSuccess', { name: user.displayName }));
    navigateToLogin(false);
  } catch (error) {
    authErrorMessage = mapAuthError(error, store.getState().lang);
  } finally {
    isSubmittingAuth = false;
    renderLoginPage();
  }
}

export function renderLoginPage() {
  const host = document.getElementById('loginView');
  if (!host) return;

  const { lang, authUser, credUser, demoUser, authReady, isAdmin, favorites, savedTrips } =
    store.getState();

  const headerActionBtn = document.getElementById('headerAuthBtn');
  if (headerActionBtn) {
    if (authUser) {
      const firstName = (authUser.displayName || authUser.email || '').split(' ')[0].slice(0, 14);
      headerActionBtn.textContent = lang === 'en' ? `Account · ${firstName}` : `Akun · ${firstName}`;
    } else if (credUser) {
      const firstName = (credUser.displayName || credUser.username || '').split(' ')[0].slice(0, 14);
      headerActionBtn.textContent = lang === 'en' ? `Account · ${firstName}` : `Akun · ${firstName}`;
    } else if (demoUser) {
      const firstName = (demoUser.displayName || '').split(' ')[0].slice(0, 14);
      headerActionBtn.textContent = `Demo · ${firstName}`;
    } else {
      headerActionBtn.textContent = store.t('navLoginBtn');
    }
  }

  if (host.hidden) return;

  const activeAccount = authUser || credUser || demoUser;
  const pageTitle = activeAccount
    ? lang === 'en'
      ? 'Account Profile'
      : 'Profil Akun'
    : authMode === 'register'
    ? store.t('authTabRegister')
    : store.t('loginFormTitle');
  const pageSub = activeAccount
    ? lang === 'en'
      ? 'Your favorites, bookings, and itineraries are saved here.'
      : 'Favorit, pemesanan, dan itinerary perjalanan Anda tersimpan di sini.'
    : lang === 'en'
    ? 'Sign in with your username or Google account.'
    : 'Masuk dengan username atau akun Google Anda.';

  let cardHtml = '';

  if (!authReady && !credUser && !demoUser) {
    cardHtml = `
      <div class="login-card">
        <h2>${escapeHtml(store.t('loginCheckingSession'))}</h2>
        <p class="login-card-desc">${escapeHtml(store.t('loginWaitDesc'))}</p>
      </div>
    `;
  } else if (!activeAccount) {
    const demoRowsHtml = demoAccounts
      .map((acc) => {
        const role = lang === 'en' ? acc.roleEn : acc.roleId;
        return `
          <div class="demo-account-row">
            <button
              type="button"
              class="demo-account-pick"
              data-fill-username="${escapeHtml(acc.username)}"
            >
              <strong>${escapeHtml(acc.displayName)}</strong>
              <span class="demo-account-email">@${escapeHtml(acc.username)} · ${escapeHtml(role)}</span>
            </button>
            <button
              type="button"
              class="btn btn-light btn-sm"
              data-demo-email="${escapeHtml(acc.username)}"
            >
              ${escapeHtml(store.t('authTabLogin'))}
            </button>
          </div>
        `;
      })
      .join('');

    cardHtml = `
      <div class="login-card">
        <div class="login-card-head">
          <h1>${escapeHtml(pageTitle)}</h1>
          <p class="login-card-desc">${escapeHtml(pageSub)}</p>
        </div>

        <div class="auth-mode-tabs" role="tablist" aria-label="Mode autentikasi">
          <button
            type="button"
            role="tab"
            aria-selected="${authMode === 'login'}"
            class="auth-mode-tab ${authMode === 'login' ? 'is-active' : ''}"
            data-auth-mode="login"
          >
            ${escapeHtml(store.t('authTabLogin'))}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="${authMode === 'register'}"
            class="auth-mode-tab ${authMode === 'register' ? 'is-active' : ''}"
            data-auth-mode="register"
          >
            ${escapeHtml(store.t('authTabRegister'))}
          </button>
        </div>

        ${
          authErrorMessage
            ? `<div class="auth-alert" role="alert">
                <p>${escapeHtml(authErrorMessage)}</p>
                ${
                  pendingClaimUsername
                    ? `<button type="button" class="btn btn-primary btn-sm auth-claim-btn" id="claimDemoPassBtn" ${
                        isSubmittingAuth ? 'disabled' : ''
                      }>${escapeHtml(
                        store.t('credClaimDemoBtn', { username: pendingClaimUsername })
                      )}</button>`
                    : ''
                }
              </div>`
            : ''
        }

        <form class="cred-login-form" id="credAuthForm">
          ${
            authMode === 'register'
              ? `<div class="form-field">
                  <label for="credDisplayNameInput">${escapeHtml(store.t('credDisplayNameLabel'))}</label>
                  <input
                    type="text"
                    id="credDisplayNameInput"
                    name="displayName"
                    maxlength="80"
                    autocomplete="name"
                    value="${escapeHtml(draftDisplayName)}"
                    placeholder="${escapeHtml(store.t('credDisplayNamePlaceholder'))}"
                  />
                </div>`
              : ''
          }
          <div class="form-field">
            <label for="credUsernameInput">${escapeHtml(store.t('credUsernameLabel'))}</label>
            <input
              type="text"
              id="credUsernameInput"
              name="username"
              autocomplete="username"
              value="${escapeHtml(draftUsername)}"
              placeholder="${escapeHtml(store.t('credUsernamePlaceholder'))}"
              required
            />
          </div>
          <div class="form-field">
            <label for="credPasswordInput">${escapeHtml(store.t('credPasswordLabel'))}</label>
            <div class="password-input-wrap">
              <input
                type="${showPassword ? 'text' : 'password'}"
                id="credPasswordInput"
                name="password"
                minlength="6"
                maxlength="128"
                autocomplete="${authMode === 'register' ? 'new-password' : 'current-password'}"
                placeholder="${escapeHtml(store.t('credPasswordPlaceholder'))}"
                required
              />
              <button
                type="button"
                class="password-toggle-btn"
                id="togglePasswordBtn"
                aria-label="${escapeHtml(showPassword ? store.t('credHidePass') : store.t('credShowPass'))}"
              >
                ${escapeHtml(
                  lang === 'en'
                    ? showPassword
                      ? 'Hide'
                      : 'Show'
                    : showPassword
                    ? 'Sembunyikan'
                    : 'Lihat'
                )}
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" ${isSubmittingAuth ? 'disabled' : ''}>
            ${escapeHtml(
              isSubmittingAuth
                ? store.t('loginSubmitting')
                : authMode === 'register'
                ? store.t('credSubmitRegister')
                : store.t('credSubmitLogin')
            )}
          </button>
        </form>

        <div class="login-divider">
          <span>${lang === 'en' ? 'or' : 'atau'}</span>
        </div>

        <button
          type="button"
          class="btn btn-google"
          id="googleSignInBtn"
          ${isSubmittingAuth ? 'disabled' : ''}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"/>
            <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"/>
          </svg>
          <span>${escapeHtml(isSubmittingAuth ? store.t('loginSubmitting') : store.t('loginGoogleBtn'))}</span>
        </button>

        <details class="demo-accounts-drawer">
          <summary>${escapeHtml(lang === 'en' ? 'Use a sample account (3)' : 'Gunakan akun contoh (3)')}</summary>
          <div class="demo-accounts-list">
            ${demoRowsHtml}
          </div>
        </details>

        <button type="button" class="login-guest-link" id="continueGuestBtn">
          ${escapeHtml(store.t('loginGuestBtn'))}
        </button>
      </div>
    `;
  } else if (authUser) {
    const avatarUrl = sanitizeUrl(authUser.photoURL);
    const initials = (authUser.displayName || authUser.email || 'U').slice(0, 2).toUpperCase();
    const roleLabel = isAdmin ? store.t('roleAdmin') : store.t('roleTraveller');

    cardHtml = `
      <div class="login-card">
        <div class="login-card-head">
          <h1>${escapeHtml(pageTitle)}</h1>
          <p class="login-card-desc">${escapeHtml(pageSub)}</p>
        </div>

        <div class="account-profile-row">
          <div class="account-avatar">
            ${
              avatarUrl
                ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(authUser.displayName || 'User')}" referrerpolicy="no-referrer" />`
                : `<span>${escapeHtml(initials)}</span>`
            }
          </div>
          <div class="account-identity">
            <h2>${escapeHtml(authUser.displayName || 'Wisatawan')}</h2>
            <p class="account-email">${escapeHtml(authUser.email || '')}</p>
            <p class="account-role">${escapeHtml(roleLabel)}</p>
          </div>
        </div>

        <div class="account-metrics">
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('planTitle4'))}</span>
            <strong class="tabular-nums">${favorites.length}</strong>
          </div>
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('savedTripsHeading'))}</span>
            <strong class="tabular-nums">${savedTrips.length}</strong>
          </div>
        </div>

        <div class="login-actions-stack">
          <button type="button" class="btn btn-primary" id="accountToPlannerBtn">
            ${escapeHtml(store.t('accountGoPlanner'))}
          </button>
          ${
            isAdmin
              ? `<button type="button" class="btn btn-light" id="accountOpenAdminBtn">${escapeHtml(
                  store.t('manageCatalog')
                )}</button>`
              : ''
          }
          <button type="button" class="btn btn-danger-outline" id="signOutBtn">
            ${escapeHtml(store.t('logoutBtn'))}
          </button>
        </div>
      </div>
    `;
  } else if (credUser) {
    const initials = (credUser.displayName || credUser.username || 'U').slice(0, 2).toUpperCase();

    cardHtml = `
      <div class="login-card">
        <div class="login-card-head">
          <h1>${escapeHtml(pageTitle)}</h1>
          <p class="login-card-desc">${escapeHtml(pageSub)}</p>
        </div>

        <div class="account-profile-row">
          <div class="account-avatar">
            <span>${escapeHtml(initials)}</span>
          </div>
          <div class="account-identity">
            <h2>${escapeHtml(credUser.displayName)}</h2>
            <p class="account-email">@${escapeHtml(credUser.username)}</p>
            <p class="account-role">${escapeHtml(store.t('roleCred'))}</p>
          </div>
        </div>

        <div class="account-metrics">
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('planTitle4'))}</span>
            <strong class="tabular-nums">${favorites.length}</strong>
          </div>
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('savedTripsHeading'))}</span>
            <strong class="tabular-nums">${savedTrips.length}</strong>
          </div>
        </div>

        <div class="login-actions-stack">
          <button type="button" class="btn btn-primary" id="accountToPlannerBtn">
            ${escapeHtml(store.t('accountGoPlanner'))}
          </button>
          <button type="button" class="btn btn-light" id="demoToGoogleBtn" ${isSubmittingAuth ? 'disabled' : ''}>
            ${escapeHtml(isSubmittingAuth ? store.t('loginSubmitting') : store.t('demoSwitchGoogleBtn'))}
          </button>
          <button type="button" class="btn btn-danger-outline" id="credSignOutBtn">
            ${escapeHtml(store.t('logoutBtn'))}
          </button>
        </div>
      </div>
    `;
  } else {
    const initials = (demoUser.displayName || 'D').slice(0, 2).toUpperCase();
    const persona = lang === 'en' ? demoUser.roleEn : demoUser.roleId;

    cardHtml = `
      <div class="login-card">
        <div class="login-card-head">
          <h1>${escapeHtml(pageTitle)}</h1>
          <p class="login-card-desc">${escapeHtml(pageSub)}</p>
        </div>

        <div class="account-profile-row">
          <div class="account-avatar">
            <span>${escapeHtml(initials)}</span>
          </div>
          <div class="account-identity">
            <h2>${escapeHtml(demoUser.displayName)}</h2>
            <p class="account-email">@${escapeHtml(demoUser.username)}</p>
            <p class="account-role">${escapeHtml(persona)}</p>
          </div>
        </div>

        <div class="account-metrics">
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('planTitle4'))}</span>
            <strong class="tabular-nums">${favorites.length}</strong>
          </div>
          <div class="account-metric-item">
            <span class="account-metric-label">${escapeHtml(store.t('savedTripsHeading'))}</span>
            <strong class="tabular-nums">${savedTrips.length}</strong>
          </div>
        </div>

        <div class="login-actions-stack">
          <button type="button" class="btn btn-primary" id="accountToPlannerBtn">
            ${escapeHtml(store.t('accountGoPlanner'))}
          </button>
          <button type="button" class="btn btn-light" id="demoToGoogleBtn" ${isSubmittingAuth ? 'disabled' : ''}>
            ${escapeHtml(isSubmittingAuth ? store.t('loginSubmitting') : store.t('demoSwitchGoogleBtn'))}
          </button>
          <button type="button" class="btn btn-danger-outline" id="demoSignOutBtn">
            ${escapeHtml(store.t('logoutBtn'))}
          </button>
        </div>
      </div>
    `;
  }

  host.innerHTML = `
    <div class="container login-shell">
      <div class="login-top-nav">
        <button type="button" class="breadcrumb-home-btn" id="loginBackHomeBtn">
          ← ${escapeHtml(store.t('loginBackHome'))}
        </button>
        <div class="lang-switch" role="group" aria-label="Pilihan bahasa di login">
          <button type="button" class="lang-btn ${lang === 'id' ? 'is-active' : ''}" data-login-lang="id">ID</button>
          <button type="button" class="lang-btn ${lang === 'en' ? 'is-active' : ''}" data-login-lang="en">EN</button>
        </div>
      </div>
      <div class="login-surface-card">
        ${cardHtml}
      </div>
    </div>
  `;

  document.getElementById('loginBackHomeBtn')?.addEventListener('click', () => navigateToLogin(false));
  document.getElementById('continueGuestBtn')?.addEventListener('click', () => navigateToLogin(false));

  host.querySelectorAll('button[data-login-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-login-lang');
      if (next) store.setLang(next);
    });
  });

  host.querySelectorAll('button[data-auth-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      authMode = btn.getAttribute('data-auth-mode') === 'register' ? 'register' : 'login';
      authErrorMessage = '';
      pendingClaimUsername = '';
      pendingClaimPassword = '';
      renderLoginPage();
    });
  });

  document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const userEl = document.getElementById('credUsernameInput');
    const dispEl = document.getElementById('credDisplayNameInput');
    const passEl = document.getElementById('credPasswordInput');
    const currentPass = passEl?.value || '';
    if (userEl) draftUsername = userEl.value;
    if (dispEl) draftDisplayName = dispEl.value;
    showPassword = !showPassword;
    renderLoginPage();
    const nextPassEl = document.getElementById('credPasswordInput');
    if (nextPassEl) nextPassEl.value = currentPass;
  });

  document.getElementById('credAuthForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const userEl = document.getElementById('credUsernameInput');
    const passEl = document.getElementById('credPasswordInput');
    const dispEl = document.getElementById('credDisplayNameInput');
    handleCredentialSubmit(userEl?.value, passEl?.value, dispEl?.value);
  });

  document.getElementById('claimDemoPassBtn')?.addEventListener('click', handleClaimDemoPassword);
  document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('demoToGoogleBtn')?.addEventListener('click', handleGoogleSignIn);

  host.querySelectorAll('button[data-fill-username]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const username = btn.getAttribute('data-fill-username') || '';
      draftUsername = username;
      authErrorMessage = '';
      pendingClaimUsername = '';
      const input = document.getElementById('credUsernameInput');
      const passInput = document.getElementById('credPasswordInput');
      if (input) input.value = username;
      passInput?.focus();
    });
  });

  host.querySelectorAll('button[data-demo-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const identifier = btn.getAttribute('data-demo-email') || '';
      handleDemoSignIn(identifier);
    });
  });

  document.getElementById('accountToPlannerBtn')?.addEventListener('click', () => {
    navigateToPage('planner');
  });

  document.getElementById('accountOpenAdminBtn')?.addEventListener('click', () => {
    navigateToLogin(false);
    openAdminModal();
  });

  document.getElementById('credSignOutBtn')?.addEventListener('click', async () => {
    await logoutCredentialsSession();
    store.signOutCredentialSession();
    showToast(store.t('toastLogoutSuccess'));
    renderLoginPage();
  });

  document.getElementById('demoSignOutBtn')?.addEventListener('click', () => {
    store.signOutDemoAccount();
    showToast(store.t('toastLogoutSuccess'));
    renderLoginPage();
  });

  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    try {
      await signOutUser();
      showToast(store.t('toastLogoutSuccess'));
      renderLoginPage();
    } catch {
      authErrorMessage = mapAuthError(null, store.getState().lang);
      renderLoginPage();
    }
  });
}
