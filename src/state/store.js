import {
  seedDestinations,
  seedFoods,
  seedStays,
  seedPackages,
  seedTravelCars,
  seedWaterbooms,
  regions,
} from '../data/seed.js';
import { demoAccounts, findDemoAccountByEmail } from '../data/demoAccounts.js';
import { translations } from '../data/i18n.js';
import { uid } from '../utils/format.js';
import {
  syncUserPreferencesToCloud,
  saveTripToCloud,
  deleteTripFromCloud,
  saveCatalogEntryToCloud,
  deleteCatalogEntryFromCloud,
  saveTravelBookingToCloud,
  cancelTravelBookingInCloud,
  deleteTravelBookingFromCloud,
  saveStayBookingToCloud,
  cancelStayBookingInCloud,
  deleteStayBookingFromCloud,
  saveServiceBookingToCloud,
  cancelServiceBookingInCloud,
  deleteServiceBookingFromCloud,
} from '../services/firebase.js';

const STORAGE_PREFIX = 'da_v1_';

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    return parsed ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function normalizeDestinations(list) {
  if (!Array.isArray(list) || !list.length) return structuredClone(seedDestinations);
  let normalized = list.map((d) => {
    const fallbackRegion = regions.find((r) => r.name === d.region) || regions[0];
    return {
      ...d,
      cost: Math.max(0, Number(d.cost) || 0),
      facilities: Array.isArray(d.facilities) && d.facilities.length ? d.facilities : ['Area publik'],
      prayer: d.prayer || 'Fasilitas ibadah tersedia di sekitar lokasi.',
      coords: Array.isArray(d.coords) && d.coords.length === 2 ? d.coords : fallbackRegion.coords,
      photo: d.photo || '/images/destinations/d1-baiturrahman.jpg',
    };
  });

  if (readStorage('catalog_ver', 1) < 3) {
    const newSeedIds = ['d18', 'd19', 'd20', 'd21', 'd22', 'd23', 'd24'];
    let addedAny = false;
    newSeedIds.forEach((seedId) => {
      const seedEntry = seedDestinations.find((d) => d.id === seedId);
      if (seedEntry && !normalized.some((d) => d.id === seedId)) {
        normalized = [...normalized, structuredClone(seedEntry)];
        addedAny = true;
      }
    });
    if (addedAny) {
      writeStorage('destinations', normalized);
    }
    writeStorage('catalog_ver', 3);
  }

  return normalized;
}

function normalizeStays(list) {
  if (!Array.isArray(list) || !list.length) return structuredClone(seedStays);
  return list.map((s, idx) => {
    const matchingSeed = seedStays.find((seed) => seed.id === s.id);
    const fallbackPhoto =
      matchingSeed?.photo || seedStays[idx % seedStays.length]?.photo || seedStays[0].photo;
    return {
      ...s,
      price: Math.max(0, Number(s.price) || 0),
      photo: s.photo || fallbackPhoto,
    };
  });
}

const DEMO_SCOPED_KEYS = new Set([
  'favorites',
  'activities',
  'savedTrips',
  'prepChecklist',
  'travelBookings',
  'stayBookings',
  'destinationBookings',
  'foodBookings',
  'waterboomBookings',
]);

function activeStorageKey(key, scopePrefix) {
  if (scopePrefix && DEMO_SCOPED_KEYS.has(key)) {
    return `${scopePrefix}_${key}`;
  }
  return key;
}

const restoredDemoId = readStorage('demo_account_id', null);
const restoredDemoAccount = restoredDemoId
  ? demoAccounts.find((a) => a.id === restoredDemoId) || null
  : null;

function readInitialUserField(key, guestFallback, demoField) {
  if (restoredDemoAccount) {
    return readStorage(
      activeStorageKey(key, `demo_${restoredDemoAccount.id}`),
      restoredDemoAccount[demoField] ?? guestFallback
    );
  }
  return readStorage(key, guestFallback);
}

const defaultTripMeta = {
  name: 'Jelajah Aceh',
  date: new Date().toISOString().slice(0, 10),
  days: 3,
  travellers: 2,
};

const initialState = {
  lang: readStorage('lang', 'id') === 'en' ? 'en' : 'id',
  activeView: 'home',
  activePage: 'home',
  authReady: false,
  authUser: null,
  credUser: null,
  demoUser: restoredDemoAccount
    ? {
        id: restoredDemoAccount.id,
        username: restoredDemoAccount.username,
        email: restoredDemoAccount.email,
        displayName: restoredDemoAccount.displayName,
        roleId: restoredDemoAccount.roleId,
        roleEn: restoredDemoAccount.roleEn,
      }
    : null,
  isAdmin: false,
  destinations: normalizeDestinations(readStorage('destinations', seedDestinations)),
  foods: readStorage('foods', seedFoods),
  stays: normalizeStays(readStorage('stays', seedStays)),
  packages: readStorage('packages', seedPackages),
  travelCars: structuredClone(seedTravelCars),
  waterbooms: structuredClone(seedWaterbooms),
  favorites: readInitialUserField('favorites', [], 'favorites'),
  activities: readInitialUserField('activities', [], 'activities'),
  savedTrips: readInitialUserField('savedTrips', [], 'savedTrips'),
  travelBookings: readInitialUserField('travelBookings', [], 'travelBookings'),
  stayBookings: readInitialUserField('stayBookings', [], 'stayBookings'),
  destinationBookings: readInitialUserField('destinationBookings', [], 'destinationBookings'),
  foodBookings: readInitialUserField('foodBookings', [], 'foodBookings'),
  waterboomBookings: readInitialUserField('waterboomBookings', [], 'waterboomBookings'),
  prepChecklist: readInitialUserField('prepChecklist', {}, 'prepChecklist'),
  filters: {
    search: '',
    region: '',
    category: '',
    sort: 'name',
  },
  tripMeta: restoredDemoAccount
    ? structuredClone(restoredDemoAccount.tripMeta)
    : structuredClone(defaultTripMeta),
  budget: {
    transport: 250000,
    hotel: 300000,
    meal: 100000,
    tickets: 75000,
  },
};

function currentStorageScope() {
  if (initialState.authUser) return null;
  if (initialState.credUser) {
    return initialState.credUser.demoId
      ? `demo_${initialState.credUser.demoId}`
      : `cred_${initialState.credUser.username}`;
  }
  if (initialState.demoUser) return `demo_${initialState.demoUser.id}`;
  return null;
}

function writeUserStorage(key, value) {
  writeStorage(activeStorageKey(key, currentStorageScope()), value);
}

const listeners = new Set();

function syncPreferencesIfSignedIn() {
  if (initialState.authUser) {
    syncUserPreferencesToCloud(
      initialState.authUser,
      initialState.favorites,
      initialState.prepChecklist
    ).catch((err) => console.error('Cloud preference sync failed:', err));
  }
}

export const store = {
  getState() {
    return initialState;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    listeners.forEach((fn) => fn(initialState));
  },

  t(key, vars = {}) {
    const dict = translations[initialState.lang] || translations.id;
    let str = dict[key] ?? translations.id[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, String(v));
    });
    return str;
  },

  setView(view) {
    initialState.activeView = view === 'login' ? 'login' : 'home';
  },

  setPage(page) {
    initialState.activePage = page || 'home';
    initialState.activeView = page === 'login' ? 'login' : 'home';
  },

  setAuthSession({ authReady, authUser, isAdmin }) {
    initialState.authReady = Boolean(authReady);
    initialState.authUser = authUser || null;
    initialState.isAdmin = Boolean(isAdmin);
    if (authUser) {
      initialState.credUser = null;
      if (initialState.demoUser) {
        initialState.demoUser = null;
        writeStorage('demo_account_id', null);
      }
    }
    this.notify();
  },

  signInCredentialSession(user) {
    if (!user) return;
    initialState.demoUser = null;
    writeStorage('demo_account_id', null);
    initialState.credUser = user;

    const demoPreset = user.demoId ? demoAccounts.find((a) => a.id === user.demoId) || null : null;
    const scope = currentStorageScope();

    initialState.favorites = readStorage(
      activeStorageKey('favorites', scope),
      demoPreset ? demoPreset.favorites : []
    );
    initialState.prepChecklist = readStorage(
      activeStorageKey('prepChecklist', scope),
      demoPreset ? demoPreset.prepChecklist : {}
    );
    initialState.activities = readStorage(
      activeStorageKey('activities', scope),
      demoPreset ? demoPreset.activities : []
    );
    initialState.savedTrips = readStorage(
      activeStorageKey('savedTrips', scope),
      demoPreset ? demoPreset.savedTrips : []
    );
    initialState.travelBookings = readStorage(
      activeStorageKey('travelBookings', scope),
      demoPreset ? demoPreset.travelBookings || [] : []
    );
    initialState.stayBookings = readStorage(
      activeStorageKey('stayBookings', scope),
      demoPreset ? demoPreset.stayBookings || [] : []
    );
    initialState.destinationBookings = readStorage(
      activeStorageKey('destinationBookings', scope),
      demoPreset ? demoPreset.destinationBookings || [] : []
    );
    initialState.foodBookings = readStorage(
      activeStorageKey('foodBookings', scope),
      demoPreset ? demoPreset.foodBookings || [] : []
    );
    initialState.waterboomBookings = readStorage(
      activeStorageKey('waterboomBookings', scope),
      demoPreset ? demoPreset.waterboomBookings || [] : []
    );
    initialState.tripMeta = demoPreset
      ? structuredClone(demoPreset.tripMeta)
      : structuredClone(defaultTripMeta);

    writeUserStorage('favorites', initialState.favorites);
    writeUserStorage('prepChecklist', initialState.prepChecklist);
    writeUserStorage('activities', initialState.activities);
    writeUserStorage('savedTrips', initialState.savedTrips);
    writeUserStorage('travelBookings', initialState.travelBookings);
    writeUserStorage('stayBookings', initialState.stayBookings);
    writeUserStorage('destinationBookings', initialState.destinationBookings);
    writeUserStorage('foodBookings', initialState.foodBookings);
    writeUserStorage('waterboomBookings', initialState.waterboomBookings);

    this.notify();
  },

  signOutCredentialSession() {
    initialState.credUser = null;
    initialState.favorites = readStorage('favorites', []);
    initialState.prepChecklist = readStorage('prepChecklist', {});
    initialState.activities = readStorage('activities', []);
    initialState.savedTrips = readStorage('savedTrips', []);
    initialState.travelBookings = readStorage('travelBookings', []);
    initialState.stayBookings = readStorage('stayBookings', []);
    initialState.destinationBookings = readStorage('destinationBookings', []);
    initialState.foodBookings = readStorage('foodBookings', []);
    initialState.waterboomBookings = readStorage('waterboomBookings', []);
    initialState.tripMeta = structuredClone(defaultTripMeta);
    this.notify();
  },

  signInDemoAccount(email) {
    const account = findDemoAccountByEmail(email);
    if (!account) return null;

    initialState.credUser = null;
    initialState.demoUser = {
      id: account.id,
      username: account.username,
      email: account.email,
      displayName: account.displayName,
      roleId: account.roleId,
      roleEn: account.roleEn,
    };
    writeStorage('demo_account_id', account.id);

    const scope = `demo_${account.id}`;
    initialState.favorites = readStorage(activeStorageKey('favorites', scope), account.favorites);
    initialState.prepChecklist = readStorage(activeStorageKey('prepChecklist', scope), account.prepChecklist);
    initialState.activities = readStorage(activeStorageKey('activities', scope), account.activities);
    initialState.savedTrips = readStorage(activeStorageKey('savedTrips', scope), account.savedTrips);
    initialState.travelBookings = readStorage(
      activeStorageKey('travelBookings', scope),
      account.travelBookings || []
    );
    initialState.stayBookings = readStorage(
      activeStorageKey('stayBookings', scope),
      account.stayBookings || []
    );
    initialState.destinationBookings = readStorage(
      activeStorageKey('destinationBookings', scope),
      account.destinationBookings || []
    );
    initialState.foodBookings = readStorage(
      activeStorageKey('foodBookings', scope),
      account.foodBookings || []
    );
    initialState.waterboomBookings = readStorage(
      activeStorageKey('waterboomBookings', scope),
      account.waterboomBookings || []
    );
    initialState.tripMeta = structuredClone(account.tripMeta);

    writeUserStorage('favorites', initialState.favorites);
    writeUserStorage('prepChecklist', initialState.prepChecklist);
    writeUserStorage('activities', initialState.activities);
    writeUserStorage('savedTrips', initialState.savedTrips);
    writeUserStorage('travelBookings', initialState.travelBookings);
    writeUserStorage('stayBookings', initialState.stayBookings);
    writeUserStorage('destinationBookings', initialState.destinationBookings);
    writeUserStorage('foodBookings', initialState.foodBookings);
    writeUserStorage('waterboomBookings', initialState.waterboomBookings);

    this.notify();
    return initialState.demoUser;
  },

  signOutDemoAccount() {
    initialState.demoUser = null;
    writeStorage('demo_account_id', null);
    initialState.favorites = readStorage('favorites', []);
    initialState.prepChecklist = readStorage('prepChecklist', {});
    initialState.activities = readStorage('activities', []);
    initialState.savedTrips = readStorage('savedTrips', []);
    initialState.travelBookings = readStorage('travelBookings', []);
    initialState.stayBookings = readStorage('stayBookings', []);
    initialState.destinationBookings = readStorage('destinationBookings', []);
    initialState.foodBookings = readStorage('foodBookings', []);
    initialState.waterboomBookings = readStorage('waterboomBookings', []);
    initialState.tripMeta = structuredClone(defaultTripMeta);
    this.notify();
  },

  applyCloudUserData({ favorites, prepChecklist, trips, bookings, stayBookings, serviceBookings, catalogEntries }) {
    if (Array.isArray(favorites)) {
      initialState.favorites = favorites;
      writeStorage('favorites', favorites);
    }
    if (prepChecklist && typeof prepChecklist === 'object') {
      initialState.prepChecklist = prepChecklist;
      writeStorage('prepChecklist', prepChecklist);
    }
    if (Array.isArray(trips) && trips.length) {
      initialState.savedTrips = trips;
      writeStorage('savedTrips', trips);
    }
    if (Array.isArray(bookings) && bookings.length) {
      initialState.travelBookings = bookings;
      writeStorage('travelBookings', bookings);
    }
    if (Array.isArray(stayBookings) && stayBookings.length) {
      initialState.stayBookings = stayBookings;
      writeStorage('stayBookings', stayBookings);
    }
    if (Array.isArray(serviceBookings) && serviceBookings.length) {
      const destList = serviceBookings.filter((b) => b.serviceType === 'destination');
      const foodList = serviceBookings.filter((b) => b.serviceType === 'food');
      const wbList = serviceBookings.filter((b) => b.serviceType === 'waterboom');
      if (destList.length) {
        initialState.destinationBookings = destList;
        writeStorage('destinationBookings', destList);
      }
      if (foodList.length) {
        initialState.foodBookings = foodList;
        writeStorage('foodBookings', foodList);
      }
      if (wbList.length) {
        initialState.waterboomBookings = wbList;
        writeStorage('waterboomBookings', wbList);
      }
    }
    if (Array.isArray(catalogEntries) && catalogEntries.length) {
      catalogEntries.forEach((entry) => {
        const list = initialState[entry.collectionType];
        if (!Array.isArray(list) || !entry.payload?.id) return;
        const idx = list.findIndex((x) => x.id === entry.payload.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...entry.payload };
        else list.push(entry.payload);
        writeStorage(entry.collectionType, list);
      });
      initialState.destinations = normalizeDestinations(initialState.destinations);
      initialState.stays = normalizeStays(initialState.stays);
    }
    this.notify();
  },

  setLang(lang) {
    initialState.lang = lang === 'en' ? 'en' : 'id';
    writeStorage('lang', initialState.lang);
    this.notify();
  },

  setFilter(patch) {
    initialState.filters = { ...initialState.filters, ...patch };
    this.notify();
  },

  resetFilters() {
    initialState.filters = { search: '', region: '', category: '', sort: 'name' };
    this.notify();
  },

  toggleFavorite(destinationId) {
    const idx = initialState.favorites.indexOf(destinationId);
    let added = false;
    if (idx >= 0) {
      initialState.favorites.splice(idx, 1);
    } else {
      initialState.favorites.push(destinationId);
      added = true;
    }
    writeUserStorage('favorites', initialState.favorites);
    syncPreferencesIfSignedIn();
    this.notify();
    return added;
  },

  clearFavorites() {
    initialState.favorites = [];
    writeUserStorage('favorites', []);
    syncPreferencesIfSignedIn();
    this.notify();
  },

  setTripMeta(patch) {
    initialState.tripMeta = { ...initialState.tripMeta, ...patch };
    this.notify();
  },

  setBudget(patch) {
    initialState.budget = { ...initialState.budget, ...patch };
    this.notify();
  },

  addActivity(destinationId, day) {
    if (!destinationId) return;
    const maxDays = Number(initialState.tripMeta.days) || 3;
    const assignedDay = Math.min(maxDays, Math.max(1, Number(day) || initialState.activities.length + 1));
    initialState.activities.push({
      id: uid('act'),
      destinationId,
      day: assignedDay,
    });
    writeUserStorage('activities', initialState.activities);
    this.notify();
  },

  updateActivityDay(activityId, day) {
    const item = initialState.activities.find((a) => a.id === activityId);
    if (!item) return;
    item.day = Math.max(1, Number(day) || 1);
    writeUserStorage('activities', initialState.activities);
    this.notify();
  },

  removeActivity(activityId) {
    initialState.activities = initialState.activities.filter((a) => a.id !== activityId);
    writeUserStorage('activities', initialState.activities);
    this.notify();
  },

  loadPackageIntoTrip(pkg) {
    if (!pkg) return;
    initialState.tripMeta.name = pkg.name;
    initialState.tripMeta.days = pkg.duration;
    initialState.activities = (pkg.destinations || []).map((destId, index) => ({
      id: uid('act'),
      destinationId: destId,
      day: Math.min(pkg.duration, index + 1),
    }));
    writeUserStorage('activities', initialState.activities);
    this.notify();
  },

  saveCurrentTrip(totalEstimate) {
    const trip = {
      id: uid('trip'),
      name: initialState.tripMeta.name.trim() || 'Jelajah Aceh',
      date: initialState.tripMeta.date,
      days: Number(initialState.tripMeta.days) || 1,
      travellers: Math.max(1, Number(initialState.tripMeta.travellers) || 1),
      activities: structuredClone(initialState.activities),
      totalEstimate,
      savedAt: new Date().toISOString(),
    };
    initialState.savedTrips.unshift(trip);
    writeUserStorage('savedTrips', initialState.savedTrips);
    if (initialState.authUser) {
      saveTripToCloud(initialState.authUser, trip).catch((err) =>
        console.error('Cloud trip save failed:', err)
      );
    }
    this.notify();
  },

  loadSavedTrip(tripId) {
    const trip = initialState.savedTrips.find((t) => t.id === tripId);
    if (!trip) return;
    initialState.tripMeta = {
      name: trip.name,
      date: trip.date || new Date().toISOString().slice(0, 10),
      days: trip.days,
      travellers: trip.travellers,
    };
    initialState.activities = structuredClone(trip.activities || []);
    writeUserStorage('activities', initialState.activities);
    this.notify();
  },

  deleteSavedTrip(tripId) {
    initialState.savedTrips = initialState.savedTrips.filter((t) => t.id !== tripId);
    writeUserStorage('savedTrips', initialState.savedTrips);
    if (initialState.authUser) {
      deleteTripFromCloud(initialState.authUser, tripId).catch((err) =>
        console.error('Cloud trip delete failed:', err)
      );
    }
    this.notify();
  },

  togglePrepItem(key, checked) {
    initialState.prepChecklist[key] = !!checked;
    writeUserStorage('prepChecklist', initialState.prepChecklist);
    syncPreferencesIfSignedIn();
    this.notify();
  },

  resetPrepChecklist() {
    initialState.prepChecklist = {};
    writeUserStorage('prepChecklist', {});
    syncPreferencesIfSignedIn();
    this.notify();
  },

  createTravelBooking(payload) {
    const codeDigits = Math.floor(1000 + Math.random() * 9000);
    const booking = {
      id: uid('bk'),
      bookingCode: `DA-TRV-${codeDigits}`,
      vehicleId: payload.vehicleId,
      vehicleName: payload.vehicleName,
      vehicleContact: payload.vehicleContact || '6281234567011',
      pickupLocation: payload.pickupLocation,
      destinationRegion: payload.destinationRegion,
      pickupDate: payload.pickupDate,
      days: Math.min(7, Math.max(1, Math.trunc(Number(payload.days) || 1))),
      passengers: Math.min(12, Math.max(1, Math.trunc(Number(payload.passengers) || 1))),
      serviceType: payload.serviceType === 'driver_only' ? 'driver_only' : 'driver_fuel',
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      notes: payload.notes || '',
      totalEstimate: Math.max(0, Number(payload.totalEstimate) || 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    initialState.travelBookings.unshift(booking);
    writeUserStorage('travelBookings', initialState.travelBookings);
    if (initialState.authUser) {
      saveTravelBookingToCloud(initialState.authUser, booking).catch((err) =>
        console.error('Cloud booking save failed:', err)
      );
    }
    this.notify();
    return booking;
  },

  cancelTravelBooking(bookingId) {
    const target = initialState.travelBookings.find((b) => b.id === bookingId);
    if (!target || target.status === 'cancelled') return;
    target.status = 'cancelled';
    writeUserStorage('travelBookings', initialState.travelBookings);
    if (initialState.authUser) {
      cancelTravelBookingInCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud booking cancel failed:', err)
      );
    }
    this.notify();
  },

  deleteTravelBooking(bookingId) {
    initialState.travelBookings = initialState.travelBookings.filter((b) => b.id !== bookingId);
    writeUserStorage('travelBookings', initialState.travelBookings);
    if (initialState.authUser) {
      deleteTravelBookingFromCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud booking delete failed:', err)
      );
    }
    this.notify();
  },

  createStayBooking(payload) {
    const codeDigits = Math.floor(1000 + Math.random() * 9000);
    const booking = {
      id: uid('htl'),
      bookingCode: `DA-HTL-${codeDigits}`,
      stayId: payload.stayId,
      stayName: payload.stayName,
      stayRegion: payload.stayRegion,
      stayContact: payload.stayContact || '6281234567004',
      roomType: payload.roomType || 'Standard Syariah',
      checkInDate: payload.checkInDate,
      nights: Math.min(14, Math.max(1, Math.trunc(Number(payload.nights) || 1))),
      rooms: Math.min(5, Math.max(1, Math.trunc(Number(payload.rooms) || 1))),
      guests: Math.min(12, Math.max(1, Math.trunc(Number(payload.guests) || 1))),
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      notes: payload.notes || '',
      totalEstimate: Math.max(0, Number(payload.totalEstimate) || 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    initialState.stayBookings.unshift(booking);
    writeUserStorage('stayBookings', initialState.stayBookings);
    if (initialState.authUser) {
      saveStayBookingToCloud(initialState.authUser, booking).catch((err) =>
        console.error('Cloud stay booking save failed:', err)
      );
    }
    this.notify();
    return booking;
  },

  cancelStayBooking(bookingId) {
    const target = initialState.stayBookings.find((b) => b.id === bookingId);
    if (!target || target.status === 'cancelled') return;
    target.status = 'cancelled';
    writeUserStorage('stayBookings', initialState.stayBookings);
    if (initialState.authUser) {
      cancelStayBookingInCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud stay booking cancel failed:', err)
      );
    }
    this.notify();
  },

  deleteStayBooking(bookingId) {
    initialState.stayBookings = initialState.stayBookings.filter((b) => b.id !== bookingId);
    writeUserStorage('stayBookings', initialState.stayBookings);
    if (initialState.authUser) {
      deleteStayBookingFromCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud stay booking delete failed:', err)
      );
    }
    this.notify();
  },

  createDestinationBooking(payload) {
    const codeDigits = Math.floor(1000 + Math.random() * 9000);
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(payload.quantity) || 1)));
    const unitPrice = Math.max(0, Number(payload.unitPrice) || 0);
    const booking = {
      id: uid('dst'),
      bookingCode: `DA-DST-${codeDigits}`,
      serviceType: 'destination',
      itemId: payload.itemId,
      itemName: payload.itemName,
      itemRegion: payload.itemRegion || 'Aceh',
      serviceDate: payload.serviceDate,
      quantity: qty,
      unitPrice,
      totalEstimate: unitPrice * qty,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      notes: payload.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    initialState.destinationBookings.unshift(booking);
    writeUserStorage('destinationBookings', initialState.destinationBookings);
    if (initialState.authUser) {
      saveServiceBookingToCloud(initialState.authUser, booking).catch((err) =>
        console.error('Cloud destination booking save failed:', err)
      );
    }
    this.notify();
    return booking;
  },

  cancelDestinationBooking(bookingId) {
    const target = initialState.destinationBookings.find((b) => b.id === bookingId);
    if (!target || target.status === 'cancelled') return;
    target.status = 'cancelled';
    writeUserStorage('destinationBookings', initialState.destinationBookings);
    if (initialState.authUser) {
      cancelServiceBookingInCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud destination booking cancel failed:', err)
      );
    }
    this.notify();
  },

  deleteDestinationBooking(bookingId) {
    initialState.destinationBookings = initialState.destinationBookings.filter((b) => b.id !== bookingId);
    writeUserStorage('destinationBookings', initialState.destinationBookings);
    if (initialState.authUser) {
      deleteServiceBookingFromCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud destination booking delete failed:', err)
      );
    }
    this.notify();
  },

  createFoodBooking(payload) {
    const codeDigits = Math.floor(1000 + Math.random() * 9000);
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(payload.quantity) || 1)));
    const unitPrice = Math.max(0, Number(payload.unitPrice) || 0);
    const booking = {
      id: uid('kul'),
      bookingCode: `DA-KUL-${codeDigits}`,
      serviceType: 'food',
      itemId: payload.itemId,
      itemName: payload.itemName,
      itemRegion: payload.itemRegion || 'Aceh',
      itemContact: payload.itemContact || '6281234567001',
      serviceDate: payload.serviceDate,
      quantity: qty,
      unitPrice,
      totalEstimate: unitPrice * qty,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      notes: payload.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    initialState.foodBookings.unshift(booking);
    writeUserStorage('foodBookings', initialState.foodBookings);
    if (initialState.authUser) {
      saveServiceBookingToCloud(initialState.authUser, booking).catch((err) =>
        console.error('Cloud food booking save failed:', err)
      );
    }
    this.notify();
    return booking;
  },

  cancelFoodBooking(bookingId) {
    const target = initialState.foodBookings.find((b) => b.id === bookingId);
    if (!target || target.status === 'cancelled') return;
    target.status = 'cancelled';
    writeUserStorage('foodBookings', initialState.foodBookings);
    if (initialState.authUser) {
      cancelServiceBookingInCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud food booking cancel failed:', err)
      );
    }
    this.notify();
  },

  deleteFoodBooking(bookingId) {
    initialState.foodBookings = initialState.foodBookings.filter((b) => b.id !== bookingId);
    writeUserStorage('foodBookings', initialState.foodBookings);
    if (initialState.authUser) {
      deleteServiceBookingFromCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud food booking delete failed:', err)
      );
    }
    this.notify();
  },

  createWaterboomBooking(payload) {
    const codeDigits = Math.floor(1000 + Math.random() * 9000);
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(payload.quantity) || 1)));
    const unitPrice = Math.max(0, Number(payload.unitPrice) || 0);
    const booking = {
      id: uid('wbm'),
      bookingCode: `DA-WBM-${codeDigits}`,
      serviceType: 'waterboom',
      itemId: payload.itemId,
      itemName: payload.itemName,
      itemRegion: payload.itemRegion || 'Aceh',
      serviceDate: payload.serviceDate,
      quantity: qty,
      unitPrice,
      totalEstimate: unitPrice * qty,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      notes: payload.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    initialState.waterboomBookings.unshift(booking);
    writeUserStorage('waterboomBookings', initialState.waterboomBookings);
    if (initialState.authUser) {
      saveServiceBookingToCloud(initialState.authUser, booking).catch((err) =>
        console.error('Cloud waterboom booking save failed:', err)
      );
    }
    this.notify();
    return booking;
  },

  cancelWaterboomBooking(bookingId) {
    const target = initialState.waterboomBookings.find((b) => b.id === bookingId);
    if (!target || target.status === 'cancelled') return;
    target.status = 'cancelled';
    writeUserStorage('waterboomBookings', initialState.waterboomBookings);
    if (initialState.authUser) {
      cancelServiceBookingInCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud waterboom booking cancel failed:', err)
      );
    }
    this.notify();
  },

  deleteWaterboomBooking(bookingId) {
    initialState.waterboomBookings = initialState.waterboomBookings.filter((b) => b.id !== bookingId);
    writeUserStorage('waterboomBookings', initialState.waterboomBookings);
    if (initialState.authUser) {
      deleteServiceBookingFromCloud(initialState.authUser, bookingId).catch((err) =>
        console.error('Cloud waterboom booking delete failed:', err)
      );
    }
    this.notify();
  },

  getAllOrdersSummary() {
    const sumActive = (list) =>
      list
        .filter((b) => b.status !== 'cancelled')
        .reduce((acc, b) => acc + Math.max(0, Number(b.totalEstimate) || 0), 0);
    const activeCount = (list) => list.filter((b) => b.status !== 'cancelled').length;

    const destinationSubtotal = sumActive(initialState.destinationBookings);
    const foodSubtotal = sumActive(initialState.foodBookings);
    const staySubtotal = sumActive(initialState.stayBookings);
    const waterboomSubtotal = sumActive(initialState.waterboomBookings);
    const travelSubtotal = sumActive(initialState.travelBookings);

    const grandTotal =
      destinationSubtotal + foodSubtotal + staySubtotal + waterboomSubtotal + travelSubtotal;

    const totalActiveCount =
      activeCount(initialState.destinationBookings) +
      activeCount(initialState.foodBookings) +
      activeCount(initialState.stayBookings) +
      activeCount(initialState.waterboomBookings) +
      activeCount(initialState.travelBookings);

    return {
      destinationSubtotal,
      foodSubtotal,
      staySubtotal,
      waterboomSubtotal,
      travelSubtotal,
      grandTotal,
      totalActiveCount,
      counts: {
        destinations: activeCount(initialState.destinationBookings),
        foods: activeCount(initialState.foodBookings),
        stays: activeCount(initialState.stayBookings),
        waterbooms: activeCount(initialState.waterboomBookings),
        travelCars: activeCount(initialState.travelBookings),
      },
    };
  },

  upsertCatalogItem(type, payload) {
    const validTypes = ['destinations', 'foods', 'stays', 'packages'];
    if (!validTypes.includes(type)) return;
    const list = initialState[type];
    const existingIdx = list.findIndex((x) => x.id === payload.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...payload };
    } else {
      list.push(payload);
    }
    writeStorage(type, list);
    if (initialState.authUser && initialState.isAdmin) {
      saveCatalogEntryToCloud(initialState.authUser, type, payload).catch((err) =>
        console.error('Cloud catalog save failed:', err)
      );
    }
    this.notify();
  },

  deleteCatalogItem(type, id) {
    const validTypes = ['destinations', 'foods', 'stays', 'packages'];
    if (!validTypes.includes(type)) return;
    initialState[type] = initialState[type].filter((x) => x.id !== id);
    if (type === 'destinations') {
      initialState.favorites = initialState.favorites.filter((fid) => fid !== id);
      initialState.activities = initialState.activities.filter((a) => a.destinationId !== id);
      writeUserStorage('favorites', initialState.favorites);
      writeUserStorage('activities', initialState.activities);
    }
    writeStorage(type, initialState[type]);
    if (initialState.authUser && initialState.isAdmin) {
      deleteCatalogEntryFromCloud(id).catch((err) =>
        console.error('Cloud catalog delete failed:', err)
      );
    }
    this.notify();
  },

  resetCatalogToDefaults() {
    initialState.destinations = structuredClone(seedDestinations);
    initialState.foods = structuredClone(seedFoods);
    initialState.stays = structuredClone(seedStays);
    initialState.packages = structuredClone(seedPackages);
    writeStorage('destinations', initialState.destinations);
    writeStorage('foods', initialState.foods);
    writeStorage('stays', initialState.stays);
    writeStorage('packages', initialState.packages);
    this.notify();
  },
};
