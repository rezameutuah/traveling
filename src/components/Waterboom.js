import { store } from '../state/store.js';
import { escapeHtml, formatCurrency, sanitizeUrl } from '../utils/format.js';
import { showToast } from '../utils/toast.js';
import { attachImageFallback } from './ExploreAndGallery.js';
import { openDetailModal } from './Modals.js';
import { focusDestinationOnMap } from './RegionMap.js';

let activeWaterboomRegion = '';

const wbDraft = {
  itemId: 'wb-mata-ie',
  serviceDate: new Date().toISOString().slice(0, 10),
  quantity: 3,
  contactName: '',
  contactPhone: '',
  notes: '',
};

function getSelectedWaterboom() {
  const { waterbooms } = store.getState();
  return waterbooms.find((wb) => wb.id === wbDraft.itemId) || waterbooms[0];
}

function renderWaterboomEstimate() {
  const box = document.getElementById('wbEstimateBox');
  if (!box) return;
  const wb = getSelectedWaterboom();
  const qty = Math.min(50, Math.max(1, Math.trunc(Number(wbDraft.quantity) || 1)));
  const unitPrice = Math.max(0, Number(wb?.ticketEstimate) || 0);
  const total = unitPrice * qty;

  box.innerHTML = `
    <div class="budget-line">
      <span>${escapeHtml(store.t('wbUnitLine'))}</span>
      <span class="tabular-nums">${escapeHtml(formatCurrency(unitPrice))}</span>
    </div>
    <div class="budget-total">
      <span>${escapeHtml(store.t('wbRateTotalLine'))}</span>
      <strong class="tabular-nums">${escapeHtml(formatCurrency(total))}</strong>
    </div>
  `;
}

function syncWaterboomBookingForm() {
  const { waterbooms, authUser, credUser, demoUser } = store.getState();
  const selected = getSelectedWaterboom();
  if (selected) wbDraft.itemId = selected.id;

  const activeName =
    authUser?.displayName || credUser?.displayName || demoUser?.displayName || '';
  if (!wbDraft.contactName && activeName) {
    wbDraft.contactName = activeName;
  }

  const selectEl = document.getElementById('wbBookingSelect');
  if (selectEl) {
    selectEl.innerHTML = waterbooms
      .map(
        (wb) =>
          `<option value="${escapeHtml(wb.id)}">${escapeHtml(wb.name)} (${escapeHtml(
            wb.region
          )} · ${escapeHtml(formatCurrency(wb.ticketEstimate))})</option>`
      )
      .join('');
    selectEl.value = wbDraft.itemId;
  }

  const dateEl = document.getElementById('wbBookingDateInput');
  if (dateEl && dateEl !== document.activeElement) dateEl.value = wbDraft.serviceDate;

  const qtyEl = document.getElementById('wbBookingQtyInput');
  if (qtyEl && qtyEl !== document.activeElement) qtyEl.value = String(wbDraft.quantity);

  const nameEl = document.getElementById('wbBookingNameInput');
  if (nameEl && nameEl !== document.activeElement) nameEl.value = wbDraft.contactName;

  const phoneEl = document.getElementById('wbBookingPhoneInput');
  if (phoneEl && phoneEl !== document.activeElement) phoneEl.value = wbDraft.contactPhone;

  const notesEl = document.getElementById('wbBookingNotesInput');
  if (notesEl && notesEl !== document.activeElement) notesEl.value = wbDraft.notes;
}

function renderWaterboomBookingsList() {
  const host = document.getElementById('wbBookingsList');
  if (!host) return;
  const { waterboomBookings, lang } = store.getState();

  if (!waterboomBookings.length) {
    host.innerHTML = `<p class="muted-empty">${escapeHtml(store.t('wbListEmpty'))}</p>`;
    return;
  }

  host.innerHTML = waterboomBookings
    .map((bk) => {
      const isCancelled = bk.status === 'cancelled';
      const statusLabel = isCancelled ? store.t('wbStatusCancelled') : store.t('wbStatusPending');

      return `
        <div class="booking-row ${isCancelled ? 'is-cancelled' : ''}">
          <div class="booking-row-head">
            <div>
              <span class="booking-code tabular-nums">${escapeHtml(bk.bookingCode)}</span>
              <h4>${escapeHtml(bk.itemName)}</h4>
            </div>
            <span class="booking-status ${isCancelled ? 'is-cancelled' : 'is-pending'}">
              ${escapeHtml(statusLabel)}
            </span>
          </div>

          <p class="card-meta">
            <span>${escapeHtml(bk.itemRegion)}</span>
          </p>

          <p class="booking-specs tabular-nums">
            ${escapeHtml(bk.serviceDate)} · ${bk.quantity} ${escapeHtml(
        lang === 'en' ? 'ticket(s)' : 'tiket'
      )} · ${escapeHtml(bk.contactName)}
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
                      class="btn btn-outline btn-sm"
                      data-cancel-wb-booking="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carCancelBtn'))}
                    </button>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger-outline btn-sm"
                data-delete-wb-booking="${escapeHtml(bk.id)}"
              >
                ${escapeHtml(store.t('carDeleteBtn'))}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-cancel-wb-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-wb-booking');
      if (id) {
        store.cancelWaterboomBooking(id);
        showToast(store.t('toastWbCancelled'));
      }
    });
  });

  host.querySelectorAll('button[data-delete-wb-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-wb-booking');
      if (id) store.deleteWaterboomBooking(id);
    });
  });
}

export function initWaterboomBookingControls() {
  document.getElementById('wbBookingSelect')?.addEventListener('change', (e) => {
    wbDraft.itemId = e.target.value;
    renderWaterboomSection();
  });

  document.getElementById('wbBookingDateInput')?.addEventListener('change', (e) => {
    wbDraft.serviceDate = e.target.value;
  });

  document.getElementById('wbBookingQtyInput')?.addEventListener('input', (e) => {
    wbDraft.quantity = Math.min(50, Math.max(1, Number(e.target.value) || 1));
    renderWaterboomEstimate();
  });

  document.getElementById('wbBookingNameInput')?.addEventListener('input', (e) => {
    wbDraft.contactName = e.target.value;
  });

  document.getElementById('wbBookingPhoneInput')?.addEventListener('input', (e) => {
    wbDraft.contactPhone = e.target.value;
  });

  document.getElementById('wbBookingNotesInput')?.addEventListener('input', (e) => {
    wbDraft.notes = e.target.value;
  });

  document.getElementById('waterboomBookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const wb = getSelectedWaterboom();
    if (!wb) return;

    const cleanName = wbDraft.contactName.trim();
    const cleanPhone = wbDraft.contactPhone.trim();
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(wbDraft.quantity) || 0)));

    if (
      cleanName.length < 1 ||
      cleanPhone.length < 6 ||
      cleanPhone.length > 24 ||
      !wbDraft.serviceDate
    ) {
      showToast(store.t('toastWbInvalidForm'));
      return;
    }

    const created = store.createWaterboomBooking({
      itemId: wb.id,
      itemName: wb.name,
      itemRegion: wb.region,
      serviceDate: wbDraft.serviceDate,
      quantity: qty,
      unitPrice: Math.max(0, Number(wb.ticketEstimate) || 0),
      contactName: cleanName,
      contactPhone: cleanPhone,
      notes: wbDraft.notes.trim(),
    });

    wbDraft.notes = '';
    const notesEl = document.getElementById('wbBookingNotesInput');
    if (notesEl) notesEl.value = '';

    showToast(store.t('toastWbBooked', { code: created.bookingCode }));
  });
}

export function renderWaterboomSection() {
  const host = document.getElementById('waterboomCards');
  const filterHost = document.getElementById('waterboomRegionTabs');
  const countHost = document.getElementById('waterboomCount');
  if (!host) return;

  const { lang, waterbooms } = store.getState();
  const list = waterbooms || [];

  const uniqueRegions = Array.from(new Set(list.map((wb) => wb.region)));

  if (filterHost) {
    const tabs = [
      { value: '', label: store.t('waterboomAllRegions') },
      ...uniqueRegions.map((r) => ({ value: r, label: r })),
    ];
    filterHost.innerHTML = tabs
      .map(
        (t) => `
          <button
            type="button"
            role="tab"
            aria-selected="${activeWaterboomRegion === t.value ? 'true' : 'false'}"
            class="tab-btn ${activeWaterboomRegion === t.value ? 'is-active' : ''}"
            data-wb-region="${escapeHtml(t.value)}"
          >
            ${escapeHtml(t.label)}
          </button>
        `
      )
      .join('');

    filterHost.querySelectorAll('button[data-wb-region]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeWaterboomRegion = btn.getAttribute('data-wb-region') || '';
        renderWaterboomSection();
      });
    });
  }

  const filtered = activeWaterboomRegion
    ? list.filter((wb) => wb.region === activeWaterboomRegion)
    : list;

  if (countHost) {
    countHost.textContent = store.t('waterboomShowingCount', {
      shown: filtered.length,
      total: list.length,
    });
  }

  const selectedWb = getSelectedWaterboom();

  host.innerHTML = filtered
    .map((wb, index) => {
      const location = lang === 'en' ? wb.locationEn : wb.locationId;
      const summary = lang === 'en' ? wb.summaryEn : wb.summaryId;
      const rides = lang === 'en' ? wb.ridesEn : wb.ridesId;
      const muslimNotes = lang === 'en' ? wb.muslimNotesEn : wb.muslimNotesId;
      const photoUrl = sanitizeUrl(wb.photo);
      const isLead = index === 0 && filtered.length % 2 === 1;
      const isSelected = selectedWb?.id === wb.id;

      return `
        <article class="waterboom-card ${isLead ? 'is-featured' : ''} ${isSelected ? 'is-selected' : ''}">
          <div class="waterboom-media">
            ${
              photoUrl
                ? `<img
                    src="${escapeHtml(photoUrl)}"
                    alt="${escapeHtml(wb.name)} — ${escapeHtml(wb.region)}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    data-fallback-title="${escapeHtml(wb.name)}"
                  />`
                : `<div class="img-fallback"><span>${escapeHtml(wb.name)}</span></div>`
            }
          </div>

          <div class="waterboom-body">
            <div class="waterboom-head">
              <div>
                <p class="card-meta">
                  <span>Waterboom</span>
                  <span aria-hidden="true">·</span>
                  <span>${escapeHtml(wb.region)}</span>
                </p>
                <h3>${escapeHtml(wb.name)}</h3>
              </div>
              <div class="waterboom-price-block">
                <span class="waterboom-price-label">${escapeHtml(store.t('waterboomTicketLabel'))}</span>
                <strong class="price-text tabular-nums">${escapeHtml(formatCurrency(wb.ticketEstimate))}</strong>
              </div>
            </div>

            <p class="waterboom-summary">${escapeHtml(summary)}</p>

            <div class="waterboom-specs">
              <div>
                <span class="detail-spec-label">${escapeHtml(store.t('waterboomLocationLabel'))}</span>
                <span>${escapeHtml(location)}</span>
              </div>
              <div>
                <span class="detail-spec-label">${escapeHtml(store.t('waterboomHoursLabel'))}</span>
                <span class="tabular-nums">${escapeHtml(wb.hours)}</span>
              </div>
              <div class="waterboom-spec-wide">
                <span class="detail-spec-label">${escapeHtml(store.t('waterboomPrayerLabel'))}</span>
                <span>${escapeHtml(muslimNotes)}</span>
              </div>
            </div>

            <div class="waterboom-rides">
              <p class="detail-spec-label">${escapeHtml(store.t('waterboomRidesLabel'))}</p>
              <ul>
                ${(rides || []).map((ride) => `<li>${escapeHtml(ride)}</li>`).join('')}
              </ul>
            </div>

            <div class="waterboom-actions">
              <button
                type="button"
                class="btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm"
                data-select-wb="${escapeHtml(wb.id)}"
              >
                ${escapeHtml(isSelected ? store.t('wbBookSelectedBtn') : store.t('wbBookBtn'))}
              </button>
              <button
                type="button"
                class="btn btn-light btn-sm"
                data-wb-trip="${escapeHtml(wb.destinationId)}"
              >
                ${escapeHtml(store.t('waterboomBtnTrip'))}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                data-wb-detail="${escapeHtml(wb.destinationId)}"
              >
                ${escapeHtml(store.t('waterboomBtnDetail'))}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                data-wb-map="${escapeHtml(wb.destinationId)}"
              >
                ${escapeHtml(store.t('waterboomBtnMap'))}
              </button>
              <a
                class="btn btn-outline btn-sm"
                href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${wb.name} ${wb.region} Aceh`
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHtml(store.t('waterboomBtnMapsExternal'))}
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  attachImageFallback(host);

  host.querySelectorAll('button[data-select-wb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-select-wb');
      if (!id) return;
      wbDraft.itemId = id;
      renderWaterboomSection();
      document
        .getElementById('waterboomBookingForm')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  host.querySelectorAll('button[data-wb-trip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const destId = btn.getAttribute('data-wb-trip');
      if (!destId) return;
      store.addActivity(destId);
      showToast(store.t('toastActivityAdded'));
    });
  });

  host.querySelectorAll('button[data-wb-detail]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const destId = btn.getAttribute('data-wb-detail');
      if (destId) openDetailModal(destId);
    });
  });

  host.querySelectorAll('button[data-wb-map]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const destId = btn.getAttribute('data-wb-map');
      if (destId) focusDestinationOnMap(destId);
    });
  });

  syncWaterboomBookingForm();
  renderWaterboomEstimate();
  renderWaterboomBookingsList();
}
