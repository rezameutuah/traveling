# Discover Aceh — Firestore Security Specification

## 1. Data Invariants
1. A `/users/{userId}` document may only be read, created, or updated by the verified user matching `userId`, with `uid == request.auth.uid` immutable after creation.
2. A `/users/{userId}/trips/{tripId}` document requires the parent `/users/{userId}` profile to exist (`exists()`), must belong to `userId == request.auth.uid`, and enforces `days` between `1` and `5` and `travellers` between `1` and `50`.
3. `/admins/{userId}` may not be self-assigned by non-admin users; only the verified bootstrap admin (`meutuah456@gmail.com` with `email_verified == true`) or existing admins may manage admin markers.
4. `/catalogEntries/{entryId}` is readable for app rendering only by signed-in verified users or public catalog consumers, and mutations (`create`, `update`, `delete`) are strictly restricted to `isAdmin()`.
5. All document IDs (`userId`, `tripId`, `bookingId`, `entryId`) must satisfy `isValidId()` (`^[a-zA-Z0-9_\\-]+$`, max 128 chars).
6. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
7. A `/users/{userId}/bookings/{bookingId}` document requires parent `/users/{userId}` to exist, enforces `userId == request.auth.uid`, limits `days` (`1..7`) and `passengers` (`1..12`), starts with `status == 'pending'`, and prevents non-admin modifications once `status == 'cancelled'`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `get`/`create` on `/users/user_1`.
2. Authenticated user `user_2` reading `/users/user_1` or `/users/user_1/bookings/b1` (cross-user PII/phone leak).
3. User creating `/users/user_1` with `uid: "user_2"` (identity spoofing).
4. User creating `/users/user_1` with an extra shadow field `isAdmin: true`.
5. User updating `/users/user_1` attempting to mutate `createdAt` or `uid`.
6. User creating `/users/user_1/trips/trip_1` with `days: 99` (boundary violation).
7. User creating `/users/user_1/trips/trip_1` with `createdAt` forged in the past instead of `request.time`.
8. User creating `/users/user_1/bookings/../../other` (path/ID poisoning).
9. User creating `/users/user_1/bookings/b1` with `passengers: 99` or `status: 'confirmed'` (boundary & initial-state bypass).
10. User updating a cancelled booking `/users/user_1/bookings/b1` back to `'pending'` or modifying `totalEstimate` (terminal state lock violation).
11. Non-admin user writing `/admins/user_2` or `/catalogEntries/d1` (privilege escalation).
12. Unverified email user matching admin email creating `/catalogEntries/item_1` (`email_verified == false`).
13. `list` query on `/users` (collection scraping — denied by default-deny).
