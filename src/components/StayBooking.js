import { store } from '../state/store.js';
import { escapeHtml, formatCurrency, sanitizeUrl } from '../utils/format.js';
import { navigateToPage } from '../utils/router.js';
import { showToast } from '../utils/toast.js';
import { attachImageFallback } from './ExploreAndGallery.js';

const stayDraft = {
  stayId: 's1',
  roomVariant: 'standard',
  checkInDate: new Date().toISOString().slice(0, 10),
  nights: 2,
  rooms: 1,
  guests: 2,
  contactName: '',
  contactPhone: '',
  notes: '',
};

function getSelectedStay() {
  const { stays } = store.getState();
  return stays.find((s) => s.id === stayDraft.stayId) || stays[0];
}

function addDaysToIso(dateStr, nights) {
  if (!dateStr) return '';
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  dt.setDate(dt.getDate() + Math.max(1, Number(nights) || 1));
  return dt.toISOString().slice(0, 10);
}

function getRoomLabel(variant) {
  if (variant === 'deluxe') {
    return store.getState().lang === 'en' ? 'Deluxe Family Sharia' : 'Deluxe Keluarga Syariah';
  }
  return store.getState().lang === 'en' ? 'Standard Sharia' : 'Standard Syariah';
}

function calculateStayEstimate(stay, roomVariant, nights, rooms) {
  if (!stay) return { nightlyRoomRate: 0, total: 0 };
  const safeNights = Math.min(14, Math.max(1, Math.trunc(Number(nights) || 1)));
  const safeRooms = Math.min(5, Math.max(1, Math.trunc(Number(rooms) || 1)));
  const multiplier = roomVariant === 'deluxe' ? 1.35 : 1;
  const nightlyRoomRate = Math.round(stay.price * multiplier) * safeRooms;
  return {
    nightlyRoomRate,
    total: nightlyRoomRate * safeNights,
  };
}

function renderStayCards() {
  const host = document.getElementById('stayCards');
  if (!host) return;
  const { stays } = store.getState();

  if (!stays.length) {
    host.innerHTML = `<div class="empty-state">${escapeHtml(store.t('noDestMatch'))}</div>`;
    return;
  }

  const activeStay = getSelectedStay();

  host.innerHTML = stays
    .map((s) => {
      const isSelected = activeStay?.id === s.id;
      const photoUrl = sanitizeUrl(s.photo);
      const waText = encodeURIComponent(
        `Halo, saya ingin menanyakan ketersediaan kamar di ${s.name} (${s.region}).`
      );
      const cleanPhone = String(s.contact || '').replace(/\D/g, '');

      return `
        <article class="catalog-card stay-card ${isSelected ? 'is-selected' : ''}">
          <div class="stay-card-media">
            ${
              photoUrl
                ? `<img
                    src="${escapeHtml(photoUrl)}"
                    alt="${escapeHtml(s.name)} — ${escapeHtml(s.region)}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    data-fallback-title="${escapeHtml(s.name)}"
                  />`
                : `<div class="img-fallback"><span>${escapeHtml(s.name)}</span></div>`
            }
          </div>

          <div class="stay-card-body">
            <div class="catalog-status is-verified">
              <span>✓</span>
              <span>${escapeHtml(s.region)}</span>
            </div>
            <h3>${escapeHtml(s.name)}</h3>
            <p class="catalog-meta">${escapeHtml(s.facilities)}</p>
            <p class="catalog-note">${escapeHtml(s.muslim)}</p>
            <div class="stay-card-footer">
              <span class="card-price tabular-nums">${escapeHtml(formatCurrency(s.price))}${escapeHtml(
                store.t('perNight')
              )}</span>
              <div class="card-actions">
                <a
                  class="btn btn-light btn-sm"
                  href="https://wa.me/${escapeHtml(cleanPhone)}?text=${waText}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                <button
                  type="button"
                  class="btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm"
                  data-select-stay="${escapeHtml(s.id)}"
                >
                  ${escapeHtml(isSelected ? store.t('staySelectedBtn') : store.t('staySelectBtn'))}
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  attachImageFallback(host);

  host.querySelectorAll('button[data-select-stay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stayId = btn.getAttribute('data-select-stay');
      if (!stayId) return;
      stayDraft.stayId = stayId;
      renderStayBookingSection();
      document.getElementById('stayBookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

function renderStayEstimateSummary() {
  const box = document.getElementById('stayEstimateBox');
  if (!box) return;

  const stay = getSelectedStay();
  const est = calculateStayEstimate(stay, stayDraft.roomVariant, stayDraft.nights, stayDraft.rooms);
  const checkOutDate = addDaysToIso(stayDraft.checkInDate, stayDraft.nights);

  box.innerHTML = `
    <div class="budget-line">
      <span>${escapeHtml(store.t('stayCheckoutLine'))}</span>
      <span class="tabular-nums">${escapeHtml(checkOutDate || '-')}</span>
    </div>
    <div class="budget-line">
      <span>${escapeHtml(
        store.t('stayRateRoomLine', { rooms: stayDraft.rooms, nights: stayDraft.nights })
      )}</span>
      <span class="tabular-nums">${escapeHtml(formatCurrency(est.total))}</span>
    </div>
    <div class="budget-total">
      <span>${escapeHtml(store.t('stayRateTotalLine'))}</span>
      <strong class="tabular-nums">${escapeHtml(formatCurrency(est.total))}</strong>
    </div>
  `;
}

function syncStayFormControls() {
  const { stays, authUser, credUser, demoUser } = store.getState();
  const activeStay = getSelectedStay();
  if (activeStay) stayDraft.stayId = activeStay.id;

  const activeName =
    authUser?.displayName || credUser?.displayName || demoUser?.displayName || '';
  if (!stayDraft.contactName && activeName) {
    stayDraft.contactName = activeName;
  }

  const staySelect = document.getElementById('staySelect');
  if (staySelect) {
    staySelect.innerHTML = stays
      .map(
        (s) =>
          `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(
            s.region
          )} · ${escapeHtml(formatCurrency(s.price))}${escapeHtml(store.t('perNight'))})</option>`
      )
      .join('');
    staySelect.value = stayDraft.stayId;
  }

  const roomEl = document.getElementById('stayRoomTypeSelect');
  if (roomEl && roomEl !== document.activeElement) {
    roomEl.value = stayDraft.roomVariant;
  }

  const checkInEl = document.getElementById('stayCheckInInput');
  if (checkInEl && checkInEl !== document.activeElement) {
    checkInEl.value = stayDraft.checkInDate;
  }

  const nightsEl = document.getElementById('stayNightsInput');
  if (nightsEl && nightsEl !== document.activeElement) {
    nightsEl.value = String(stayDraft.nights);
  }

  const roomsEl = document.getElementById('stayRoomsSelect');
  if (roomsEl && roomsEl !== document.activeElement) {
    roomsEl.value = String(stayDraft.rooms);
  }

  const guestsEl = document.getElementById('stayGuestsInput');
  if (guestsEl && guestsEl !== document.activeElement) {
    guestsEl.value = String(stayDraft.guests);
  }

  const nameEl = document.getElementById('stayNameInput');
  if (nameEl && nameEl !== document.activeElement) {
    nameEl.value = stayDraft.contactName;
  }

  const phoneEl = document.getElementById('stayPhoneInput');
  if (phoneEl && phoneEl !== document.activeElement) {
    phoneEl.value = stayDraft.contactPhone;
  }

  const notesEl = document.getElementById('stayNotesInput');
  if (notesEl && notesEl !== document.activeElement) {
    notesEl.value = stayDraft.notes;
  }
}

function renderStayBookingsList() {
  const host = document.getElementById('stayBookingsList');
  if (!host) return;
  const { stayBookings, lang, stays } = store.getState();

  if (!stayBookings.length) {
    host.innerHTML = `<p class="muted-empty">${escapeHtml(store.t('stayListEmpty'))}</p>`;
    return;
  }

  host.innerHTML = stayBookings
    .map((bk) => {
      const isCancelled = bk.status === 'cancelled';
      const statusLabel = isCancelled ? store.t('stayStatusCancelled') : store.t('stayStatusPending');
      const stayObj = stays.find((s) => s.id === bk.stayId);
      const waContact = String(bk.stayContact || stayObj?.contact || '6281234567004').replace(
        /[^0-9]/g,
        ''
      );
      const checkOutDate = addDaysToIso(bk.checkInDate, bk.nights);
      const nightlyRate = Math.round((Number(bk.totalEstimate) || 0) / Math.max(1, Number(bk.nights) || 1));

      const waMessage =
        lang === 'en'
          ? `Hello, I would like to confirm accommodation booking ${bk.bookingCode} at ${bk.stayName} (${bk.roomType}) for check-in ${bk.checkInDate} (${bk.nights} night(s), ${bk.rooms} room(s), ${bk.guests} guest(s)). Guest name: ${bk.contactName}.`
          : `Halo pengelola ${bk.stayName}, saya ingin konfirmasi pemesanan penginapan ${bk.bookingCode} (${bk.roomType}) check-in ${bk.checkInDate} selama ${bk.nights} malam (${bk.rooms} kamar, ${bk.guests} tamu). Atas nama: ${bk.contactName}.`;

      return `
        <div class="booking-row ${isCancelled ? 'is-cancelled' : ''}">
          <div class="booking-row-head">
            <div>
              <span class="booking-code tabular-nums">${escapeHtml(bk.bookingCode)}</span>
              <h4>${escapeHtml(bk.stayName)}</h4>
            </div>
            <span class="booking-status ${isCancelled ? 'is-cancelled' : 'is-pending'}">
              ${escapeHtml(statusLabel)}
            </span>
          </div>

          <p class="card-meta">
            <span>${escapeHtml(bk.stayRegion)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(bk.roomType)}</span>
          </p>

          <p class="booking-specs tabular-nums">
            ${escapeHtml(bk.checkInDate)} → ${escapeHtml(checkOutDate)} · ${bk.nights} ${escapeHtml(
        lang === 'en' ? 'night(s)' : 'malam'
      )} · ${bk.rooms} ${escapeHtml(lang === 'en' ? 'room(s)' : 'kamar')} · ${bk.guests} ${escapeHtml(
        lang === 'en' ? 'guest(s)' : 'tamu'
      )}
          </p>

          ${bk.notes ? `<p class="booking-notes">${escapeHtml(bk.notes)}</p>` : ''}

          <div class="booking-row-foot">
            <strong class="price-text tabular-nums">${escapeHtml(
              formatCurrency(bk.totalEstimate)
            )}</strong>
            <div class="list-row-actions">
              ${
                !isCancelled
                  ? `<button
                      type="button"
                      class="btn btn-light btn-sm"
                      data-sync-stay-budget="${escapeHtml(String(nightlyRate))}"
                    >
                      ${escapeHtml(store.t('staySyncBudgetBtn'))}
                    </button>
                    <a
                      class="btn btn-outline btn-sm"
                      href="https://wa.me/${encodeURIComponent(waContact)}?text=${encodeURIComponent(
                        waMessage
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHtml(store.t('stayWhatsappBtn'))}
                    </a>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      data-cancel-stay-booking="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carCancelBtn'))}
                    </button>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger-outline btn-sm"
                data-delete-stay-booking="${escapeHtml(bk.id)}"
              >
                ${escapeHtml(store.t('carDeleteBtn'))}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-sync-stay-budget]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nightly = Math.max(0, Number(btn.getAttribute('data-sync-stay-budget')) || 0);
      store.setBudget({ hotel: nightly });
      const hotelInput = document.getElementById('hotelInput');
      if (hotelInput) hotelInput.value = String(nightly);
      showToast(store.t('toastStayBudgetSynced'));
      navigateToPage('planner');
    });
  });

  host.querySelectorAll('button[data-cancel-stay-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-stay-booking');
      if (id) {
        store.cancelStayBooking(id);
        showToast(store.t('toastStayCancelled'));
      }
    });
  });

  host.querySelectorAll('button[data-delete-stay-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-stay-booking');
      if (id) store.deleteStayBooking(id);
    });
  });
}

export function initStayBookingControls() {
  document.getElementById('staySelect')?.addEventListener('change', (e) => {
    stayDraft.stayId = e.target.value;
    renderStayBookingSection();
  });

  document.getElementById('stayRoomTypeSelect')?.addEventListener('change', (e) => {
    stayDraft.roomVariant = e.target.value === 'deluxe' ? 'deluxe' : 'standard';
    renderStayEstimateSummary();
  });

  document.getElementById('stayCheckInInput')?.addEventListener('change', (e) => {
    stayDraft.checkInDate = e.target.value;
    renderStayEstimateSummary();
  });

  document.getElementById('stayNightsInput')?.addEventListener('input', (e) => {
    stayDraft.nights = Math.min(14, Math.max(1, Number(e.target.value) || 1));
    renderStayEstimateSummary();
  });

  document.getElementById('stayRoomsSelect')?.addEventListener('change', (e) => {
    stayDraft.rooms = Math.min(5, Math.max(1, Number(e.target.value) || 1));
    renderStayEstimateSummary();
  });

  document.getElementById('stayGuestsInput')?.addEventListener('input', (e) => {
    stayDraft.guests = Math.min(12, Math.max(1, Number(e.target.value) || 1));
  });

  document.getElementById('stayNameInput')?.addEventListener('input', (e) => {
    stayDraft.contactName = e.target.value;
  });

  document.getElementById('stayPhoneInput')?.addEventListener('input', (e) => {
    stayDraft.contactPhone = e.target.value;
  });

  document.getElementById('stayNotesInput')?.addEventListener('input', (e) => {
    stayDraft.notes = e.target.value;
  });

  document.getElementById('stayBookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const stay = getSelectedStay();
    if (!stay) return;

    const cleanName = stayDraft.contactName.trim();
    const cleanPhone = stayDraft.contactPhone.trim();
    const nights = Math.min(14, Math.max(1, Math.trunc(Number(stayDraft.nights) || 0)));
    const rooms = Math.min(5, Math.max(1, Math.trunc(Number(stayDraft.rooms) || 0)));
    const guests = Math.min(12, Math.max(1, Math.trunc(Number(stayDraft.guests) || 0)));

    if (
      cleanName.length < 1 ||
      cleanPhone.length < 6 ||
      cleanPhone.length > 24 ||
      !stayDraft.checkInDate
    ) {
      showToast(store.t('toastStayInvalidForm'));
      return;
    }

    const est = calculateStayEstimate(stay, stayDraft.roomVariant, nights, rooms);
    const created = store.createStayBooking({
      stayId: stay.id,
      stayName: stay.name,
      stayRegion: stay.region,
      stayContact: stay.contact,
      roomType: getRoomLabel(stayDraft.roomVariant),
      checkInDate: stayDraft.checkInDate,
      nights,
      rooms,
      guests,
      contactName: cleanName,
      contactPhone: cleanPhone,
      notes: stayDraft.notes.trim(),
      totalEstimate: est.total,
    });

    stayDraft.notes = '';
    const notesEl = document.getElementById('stayNotesInput');
    if (notesEl) notesEl.value = '';

    showToast(store.t('toastStayBooked', { code: created.bookingCode }));
  });
}

export function renderStayBookingSection() {
  renderStayCards();
  syncStayFormControls();
  renderStayEstimateSummary();
  renderStayBookingsList();
}
