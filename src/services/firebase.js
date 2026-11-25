import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const OperationType = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
});

export function handleFirestoreError(error, operationType, path) {
  const user = auth.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId || null,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithFirebaseEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithFirebaseEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName: String(displayName).slice(0, 80) });
  }
  await sendEmailVerification(result.user).catch(() => {});
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function checkIsAdmin(user) {
  if (!user || !user.emailVerified) return false;
  if (user.email === 'meutuah456@gmail.com') return true;
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

export async function loadOrCreateUserProfile(user, localDefaults) {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const displayName = String(user.displayName || user.email || 'Wisatawan').slice(0, 100);
  const safeFavs = Array.isArray(localDefaults.favorites)
    ? localDefaults.favorites.slice(0, 100).map((id) => String(id).slice(0, 64))
    : [];
  const safePrep =
    localDefaults.prepChecklist && typeof localDefaults.prepChecklist === 'object'
      ? localDefaults.prepChecklist
      : {};

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const payload = {
        uid: user.uid,
        displayName,
        favorites: safeFavs,
        prepChecklist: safePrep,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
      return { favorites: safeFavs, prepChecklist: safePrep };
    }
    const data = snap.data();
    return {
      favorites: Array.isArray(data.favorites) ? data.favorites : safeFavs,
      prepChecklist: data.prepChecklist && typeof data.prepChecklist === 'object' ? data.prepChecklist : safePrep,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function syncUserPreferencesToCloud(user, favorites, prepChecklist) {
  if (!user) return;
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const safeFavs = Array.isArray(favorites)
    ? favorites.slice(0, 100).map((id) => String(id).slice(0, 64))
    : [];
  const safePrep =
    prepChecklist && typeof prepChecklist === 'object' ? prepChecklist : {};
  const displayName = String(user.displayName || user.email || 'Wisatawan').slice(0, 100);

  try {
    await updateDoc(ref, {
      displayName,
      favorites: safeFavs,
      prepChecklist: safePrep,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchUserTripsFromCloud(user) {
  if (!user) return [];
  const path = `users/${user.uid}/trips`;
  try {
    const q = query(collection(db, 'users', user.uid, 'trips'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveTripToCloud(user, trip) {
  if (!user) return;
  const safeId = String(trip.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/trips/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'trips', safeId);

  const payload = {
    userId: user.uid,
    name: String(trip.name || 'Jelajah Aceh').slice(0, 80),
    date: String(trip.date || '').slice(0, 20),
    days: Math.min(5, Math.max(1, Math.trunc(Number(trip.days) || 1))),
    travellers: Math.min(50, Math.max(1, Math.trunc(Number(trip.travellers) || 1))),
    activities: Array.isArray(trip.activities) ? trip.activities.slice(0, 50) : [],
    totalEstimate: Math.max(0, Number(trip.totalEstimate) || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTripFromCloud(user, tripId) {
  if (!user) return;
  const safeId = String(tripId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/trips/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'trips', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchCatalogEntriesFromCloud() {
  const path = 'catalogEntries';
  try {
    const q = query(
      collection(db, 'catalogEntries'),
      where('collectionType', 'in', ['destinations', 'foods', 'stays', 'packages'])
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCatalogEntryToCloud(user, collectionType, item) {
  if (!user) return;
  const safeId = String(item.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `catalogEntries/${safeId}`;
  try {
    await setDoc(doc(db, 'catalogEntries', safeId), {
      collectionType,
      payload: item,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCatalogEntryFromCloud(itemId) {
  const safeId = String(itemId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `catalogEntries/${safeId}`;
  try {
    await deleteDoc(doc(db, 'catalogEntries', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserBookingsFromCloud(user) {
  if (!user) return [];
  const path = `users/${user.uid}/bookings`;
  try {
    const q = query(collection(db, 'users', user.uid, 'bookings'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveTravelBookingToCloud(user, booking) {
  if (!user) return;
  const safeId = String(booking.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/bookings/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'bookings', safeId);

  const safeCode = String(booking.bookingCode || 'DA-TRV-0001')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 32);

  const payload = {
    userId: user.uid,
    bookingCode: safeCode.length >= 4 ? safeCode : 'DA-TRV-0001',
    vehicleId: String(booking.vehicleId || '').slice(0, 64),
    vehicleName: String(booking.vehicleName || '').slice(0, 80),
    pickupLocation: String(booking.pickupLocation || '').slice(0, 100),
    destinationRegion: String(booking.destinationRegion || '').slice(0, 80),
    pickupDate: String(booking.pickupDate || '').slice(0, 20),
    days: Math.min(7, Math.max(1, Math.trunc(Number(booking.days) || 1))),
    passengers: Math.min(12, Math.max(1, Math.trunc(Number(booking.passengers) || 1))),
    serviceType: booking.serviceType === 'driver_only' ? 'driver_only' : 'driver_fuel',
    contactName: String(booking.contactName || 'Wisatawan').slice(0, 80),
    contactPhone: String(booking.contactPhone || '0812000000').slice(0, 24),
    notes: String(booking.notes || '').slice(0, 240),
    totalEstimate: Math.max(0, Number(booking.totalEstimate) || 0),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelTravelBookingInCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/bookings/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', user.uid, 'bookings', safeId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTravelBookingFromCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/bookings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'bookings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserStayBookingsFromCloud(user) {
  if (!user) return [];
  const path = `users/${user.uid}/stayBookings`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'stayBookings'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveStayBookingToCloud(user, booking) {
  if (!user) return;
  const safeId = String(booking.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/stayBookings/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'stayBookings', safeId);

  const safeCode = String(booking.bookingCode || 'DA-HTL-0001')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 32);

  const payload = {
    userId: user.uid,
    bookingCode: safeCode.length >= 4 ? safeCode : 'DA-HTL-0001',
    stayId: String(booking.stayId || '').slice(0, 64),
    stayName: String(booking.stayName || '').slice(0, 100),
    stayRegion: String(booking.stayRegion || '').slice(0, 80),
    roomType: String(booking.roomType || 'Standard Syariah').slice(0, 60),
    checkInDate: String(booking.checkInDate || '').slice(0, 20),
    nights: Math.min(14, Math.max(1, Math.trunc(Number(booking.nights) || 1))),
    rooms: Math.min(5, Math.max(1, Math.trunc(Number(booking.rooms) || 1))),
    guests: Math.min(12, Math.max(1, Math.trunc(Number(booking.guests) || 1))),
    contactName: String(booking.contactName || 'Wisatawan').slice(0, 80),
    contactPhone: String(booking.contactPhone || '0812000000').slice(0, 24),
    notes: String(booking.notes || '').slice(0, 240),
    totalEstimate: Math.max(0, Number(booking.totalEstimate) || 0),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelStayBookingInCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/stayBookings/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', user.uid, 'stayBookings', safeId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStayBookingFromCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/stayBookings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'stayBookings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserServiceBookingsFromCloud(user) {
  if (!user) return [];
  const path = `users/${user.uid}/serviceBookings`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'serviceBookings'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveServiceBookingToCloud(user, booking) {
  if (!user) return;
  const safeId = String(booking.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/serviceBookings/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'serviceBookings', safeId);

  const safeCode = String(booking.bookingCode || 'DA-SVC-0001')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 32);

  const validTypes = ['destination', 'food', 'waterboom'];
  const safeServiceType = validTypes.includes(booking.serviceType)
    ? booking.serviceType
    : 'destination';

  const payload = {
    userId: user.uid,
    bookingCode: safeCode.length >= 4 ? safeCode : 'DA-SVC-0001',
    serviceType: safeServiceType,
    itemId: String(booking.itemId || '').slice(0, 64),
    itemName: String(booking.itemName || '').slice(0, 120),
    itemRegion: String(booking.itemRegion || 'Aceh').slice(0, 80),
    serviceDate: String(booking.serviceDate || '').slice(0, 20),
    quantity: Math.min(50, Math.max(1, Math.trunc(Number(booking.quantity) || 1))),
    unitPrice: Math.max(0, Number(booking.unitPrice) || 0),
    totalEstimate: Math.max(0, Number(booking.totalEstimate) || 0),
    contactName: String(booking.contactName || 'Wisatawan').slice(0, 80),
    contactPhone: String(booking.contactPhone || '0812000000').slice(0, 24),
    notes: String(booking.notes || '').slice(0, 240),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelServiceBookingInCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/serviceBookings/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', user.uid, 'serviceBookings', safeId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteServiceBookingFromCloud(user, bookingId) {
  if (!user) return;
  const safeId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/serviceBookings/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'serviceBookings', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

