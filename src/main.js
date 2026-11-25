import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { store } from './state/store.js';
import {
  testFirestoreConnection,
  subscribeAuthState,
  checkIsAdmin,
  loadOrCreateUserProfile,
  fetchUserTripsFromCloud,
  fetchUserBookingsFromCloud,
  fetchUserStayBookingsFromCloud,
  fetchUserServiceBookingsFromCloud,
  fetchCatalogEntriesFromCloud,
} from './services/firebase.js';
import {
  renderExploreGroups,
  renderGallery,
  renderCarePillars,
  renderHomePortal,
} from './components/ExploreAndGallery.js';
import {
  initDestinationFilterControls,
  renderDestinationsSection,
} from './components/Destinations.js';
import {
  initAcehMap,
  renderMapMarkers,
  refreshAcehMapSize,
} from './components/RegionMap.js';
import {
  initFoodBookingControls,
  renderCulinaryAndStays,
} from './components/CulinaryAndStays.js';
import {
  initPlannerControls,
  renderPlannerSection,
} from './components/TripPlanner.js';
import {
  initChecklistControls,
  renderChecklistSection,
} from './components/Checklist.js';
import {
  initTravelCarControls,
  renderTravelCarSection,
} from './components/TravelCarBooking.js';
import {
  initStayBookingControls,
  renderStayBookingSection,
} from './components/StayBooking.js';
import {
  initWaterboomBookingControls,
  renderWaterboomSection,
} from './components/Waterboom.js';
import { renderOrderSummarySection } from './components/OrderSummary.js';
import { initModals, openAdminModal, renderAdminBody } from './components/Modals.js';
import { navigateToLogin, renderLoginPage } from './components/LoginPage.js';
import { mountPages } from './pages/index.js';
import {
  navigateToPage,
  registerRouterCallbacks,
  resolveRouteFromLocation,
  syncActivePageUI,
} from './utils/router.js';

function applyStaticTranslations() {
  const { lang } = store.getState();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = store.t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) {
      el.placeholder = store.t(key);
    }
  });

  document.querySelectorAll('button[data-lang]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function renderAll() {
  applyStaticTranslations();
  syncActivePageUI();
  renderLoginPage();
  renderExploreGroups();
  renderHomePortal();
  renderGallery();
  renderDestinationsSection();
  renderMapMarkers();
  renderCulinaryAndStays();
  renderStayBookingSection();
  renderWaterboomSection();
  renderTravelCarSection();
  renderPlannerSection();
  renderChecklistSection();
  renderCarePillars();
  renderOrderSummarySection();
  renderAdminBody();
}

function initShellInteractions() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  mobileBtn?.addEventListener('click', () => {
    if (!mobileDrawer) return;
    const isOpen = !mobileDrawer.hidden;
    mobileDrawer.hidden = isOpen;
    mobileBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  registerRouterCallbacks({
    onEnterMap: refreshAcehMapSize,
    onEnterLogin: renderLoginPage,
  });

  // Delegated multi-page navigation links (Top Bar, Mobile Drawer, Footer, Page CTAs)
  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest('[data-nav-page]') : null;
    if (!target) return;
    e.preventDefault();
    const targetPage = target.getAttribute('data-nav-page') || 'home';
    const scrollToId = target.getAttribute('data-scroll-to') || '';
    navigateToPage(targetPage, { scrollToId });
    if (mobileDrawer) {
      mobileDrawer.hidden = true;
      mobileBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('breadcrumbHomeBtn')?.addEventListener('click', () => {
    navigateToPage('home');
  });

  // Top Bar Auth/Login button
  document.getElementById('headerAuthBtn')?.addEventListener('click', () => {
    navigateToLogin(true);
  });

  // Hero Search Form
  document.getElementById('heroSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('heroSearch')?.value || '';
    store.setFilter({ search: query });
    navigateToPage('destinations');
  });

  // Language Switchers (Hero + Footer)
  document.querySelectorAll('button[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-lang');
      if (nextLang) store.setLang(nextLang);
    });
  });

  // Catalog Management Modal Triggers
  document.getElementById('openAdminHeroBtn')?.addEventListener('click', openAdminModal);
  document.getElementById('openAdminFooterBtn')?.addEventListener('click', openAdminModal);

  // Sync URL pathname & hash to active page
  const applyLocationRoute = () => {
    const route = resolveRouteFromLocation();
    navigateToPage(route.page, { scrollToId: route.scrollToId || '', updateHistory: false });
  };
  window.addEventListener('popstate', applyLocationRoute);
  window.addEventListener('hashchange', applyLocationRoute);
  applyLocationRoute();

  // Back to Top button
  const backTopBtn = document.getElementById('backTopBtn');
  window.addEventListener(
    'scroll',
    () => {
      if (backTopBtn) backTopBtn.hidden = window.scrollY < 480;
    },
    { passive: true }
  );
  backTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initFirebaseSession() {
  testFirestoreConnection();

  subscribeAuthState(async (user) => {
    if (!user) {
      store.setAuthSession({ authReady: true, authUser: null, isAdmin: false });
      return;
    }

    let isAdmin = false;
    try {
      isAdmin = await checkIsAdmin(user);
    } catch (err) {
      console.error('Admin check error:', err);
    }

    store.setAuthSession({ authReady: true, authUser: user, isAdmin });

    try {
      const current = store.getState();
      const [profileData, trips, bookings, stayBookings, serviceBookings, catalogEntries] =
        await Promise.all([
          loadOrCreateUserProfile(user, {
            favorites: current.favorites,
            prepChecklist: current.prepChecklist,
          }),
          fetchUserTripsFromCloud(user),
          fetchUserBookingsFromCloud(user),
          fetchUserStayBookingsFromCloud(user),
          fetchUserServiceBookingsFromCloud(user),
          fetchCatalogEntriesFromCloud(),
        ]);

      store.applyCloudUserData({
        favorites: profileData?.favorites,
        prepChecklist: profileData?.prepChecklist,
        trips,
        bookings,
        stayBookings,
        serviceBookings,
        catalogEntries,
      });
    } catch (err) {
      console.error('Cloud hydration error:', err);
    }
  });
}

function bootstrap() {
  mountPages();
  initShellInteractions();
  initDestinationFilterControls();
  initFoodBookingControls();
  initStayBookingControls();
  initWaterboomBookingControls();
  initTravelCarControls();
  initPlannerControls();
  initChecklistControls();
  initModals();
  initAcehMap();
  initFirebaseSession();

  store.subscribe(renderAll);
  renderAll();
}

bootstrap();
