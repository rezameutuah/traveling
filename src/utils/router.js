import { store } from '../state/store.js';

export const VALID_PAGES = [
  'home',
  'destinations',
  'region-map',
  'gallery',
  'culinary',
  'stay',
  'waterboom',
  'travel-car',
  'planner',
  'checklist',
  'summary',
  'login',
];

const PAGE_PATHS = {
  home: '/',
  destinations: '/destinasi',
  'region-map': '/peta',
  gallery: '/galeri',
  culinary: '/kuliner',
  stay: '/akomodasi',
  waterboom: '/waterboom',
  'travel-car': '/mobil-travel',
  planner: '/rencana-trip',
  checklist: '/checklist',
  summary: '/ringkasan',
  login: '/masuk',
};

const PATH_TO_PAGE = {
  '/': 'home',
  '/index.html': 'home',
  '/home': 'home',
  '/beranda': 'home',
  '/destinasi': 'destinations',
  '/destinations': 'destinations',
  '/peta': 'region-map',
  '/map': 'region-map',
  '/region-map': 'region-map',
  '/galeri': 'gallery',
  '/gallery': 'gallery',
  '/kuliner': 'culinary',
  '/culinary': 'culinary',
  '/akomodasi': 'stay',
  '/penginapan': 'stay',
  '/stay': 'stay',
  '/waterboom': 'waterboom',
  '/mobil-travel': 'travel-car',
  '/travel-car': 'travel-car',
  '/rencana-trip': 'planner',
  '/planner': 'planner',
  '/checklist': 'checklist',
  '/ringkasan': 'summary',
  '/summary': 'summary',
  '/masuk': 'login',
  '/login': 'login',
};

const HASH_TO_PAGE = {
  '': { page: 'home' },
  '#': { page: 'home' },
  '#top': { page: 'home' },
  '#home': { page: 'home' },
  '#experiences': { page: 'home', scrollToId: 'experiences' },
  '#standards': { page: 'home', scrollToId: 'standards' },
  '#destinations': { page: 'destinations' },
  '#destinasi': { page: 'destinations' },
  '#region-map': { page: 'region-map' },
  '#peta': { page: 'region-map' },
  '#gallery': { page: 'gallery' },
  '#galeri': { page: 'gallery' },
  '#culinary': { page: 'culinary' },
  '#kuliner': { page: 'culinary' },
  '#stay': { page: 'stay' },
  '#akomodasi': { page: 'stay' },
  '#waterboom': { page: 'waterboom' },
  '#travel-car': { page: 'travel-car' },
  '#mobil-travel': { page: 'travel-car' },
  '#planner': { page: 'planner' },
  '#rencana-trip': { page: 'planner' },
  '#travel-checklist': { page: 'checklist' },
  '#checklist': { page: 'checklist' },
  '#ringkasan': { page: 'summary' },
  '#summary': { page: 'summary' },
  '#login': { page: 'login' },
  '#/login': { page: 'login' },
  '#masuk': { page: 'login' },
};

const PAGE_LABEL_KEYS = {
  home: 'navHome',
  destinations: 'navDest',
  'region-map': 'navMap',
  gallery: 'navGallery',
  culinary: 'navFood',
  stay: 'navStay',
  waterboom: 'navWaterboom',
  'travel-car': 'navCar',
  planner: 'navPlan',
  checklist: 'navChecklist',
  summary: 'navSummary',
  login: 'navLoginBtn',
};

let lastMainPage = 'home';
let mapRefreshHandler = null;
let loginRenderHandler = null;

export function registerRouterCallbacks({ onEnterMap, onEnterLogin } = {}) {
  if (onEnterMap) mapRefreshHandler = onEnterMap;
  if (onEnterLogin) loginRenderHandler = onEnterLogin;
}

export function resolveRouteFromLocation() {
  const hash = String(window.location.hash || '').trim().toLowerCase();
  if (hash && HASH_TO_PAGE[hash]) {
    return HASH_TO_PAGE[hash];
  }
  const cleanHash = hash.replace(/^#\/?/, '');
  if (cleanHash && VALID_PAGES.includes(cleanHash)) {
    return { page: cleanHash };
  }

  const pathname = String(window.location.pathname || '/')
    .replace(/\/+$/, '')
    .toLowerCase() || '/';
  if (PATH_TO_PAGE[pathname]) {
    return { page: PATH_TO_PAGE[pathname] };
  }

  return { page: 'home' };
}

export function getPagePath(page) {
  return PAGE_PATHS[page] || '/';
}

export function getLastMainPage() {
  return lastMainPage;
}

export function syncActivePageUI() {
  const { activePage } = store.getState();
  const page = VALID_PAGES.includes(activePage) ? activePage : 'home';
  const isLogin = page === 'login';

  const mainEl = document.getElementById('main-content');
  const footerEl = document.querySelector('.site-footer');
  const loginView = document.getElementById('loginView');
  const breadcrumbBar = document.getElementById('pageBreadcrumbBar');
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrentPage');

  if (mainEl) mainEl.hidden = isLogin;
  if (footerEl) footerEl.hidden = isLogin;
  if (loginView) loginView.hidden = !isLogin;

  document.querySelectorAll('[data-page]').forEach((section) => {
    const targetPage = section.getAttribute('data-page');
    section.hidden = isLogin || targetPage !== page;
  });

  const labelKey = PAGE_LABEL_KEYS[page] || 'navHome';
  const pageTitle = store.t(labelKey);

  if (breadcrumbBar) {
    breadcrumbBar.hidden = isLogin || page === 'home';
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = pageTitle;
    }
  }

  document.title =
    page === 'home'
      ? 'Discover Aceh — Panduan Wisata Ramah Muslim & Perencana Perjalanan'
      : `${pageTitle} — Discover Aceh`;

  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    const target = link.getAttribute('data-nav-page');
    const isActive = target === page;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

export function navigateToPage(page, { scrollToId = '', updateHistory = true } = {}) {
  const targetPage = VALID_PAGES.includes(page) ? page : 'home';
  if (targetPage !== 'login') {
    lastMainPage = targetPage;
  }

  store.setPage(targetPage);
  syncActivePageUI();

  if (updateHistory) {
    const targetPath = getPagePath(targetPage);
    const nextUrl = scrollToId ? `${targetPath}#${scrollToId}` : targetPath;
    const currentUrl = `${window.location.pathname}${window.location.hash}`;
    if (currentUrl !== nextUrl) {
      window.history.pushState({ page: targetPage }, '', nextUrl);
    }
  }

  if (targetPage === 'login') {
    window.scrollTo({ top: 0, behavior: 'auto' });
    loginRenderHandler?.();
    return;
  }

  if (targetPage === 'region-map') {
    mapRefreshHandler?.();
  }

  if (scrollToId) {
    requestAnimationFrame(() => {
      document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
