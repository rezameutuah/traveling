import { store } from '../state/store.js';
import { escapeHtml, formatCurrency } from '../utils/format.js';
import { showToast } from '../utils/toast.js';

const foodDraft = {
  itemId: 'f1',
  serviceDate: new Date().toISOString().slice(0, 10),
  quantity: 2,
  contactName: '',
  contactPhone: '',
  notes: '',
};

function getSelectedFood() {
  const { foods } = store.getState();
  return foods.find((f) => f.id === foodDraft.itemId) || foods[0];
}

function renderFoodEstimate() {
  const box = document.getElementById('foodEstimateBox');
  if (!box) return;
  const food = getSelectedFood();
  const qty = Math.min(50, Math.max(1, Math.trunc(Number(foodDraft.quantity) || 1)));
  const unitPrice = Math.max(0, Number(food?.price) || 0);
  const total = unitPrice * qty;

  box.innerHTML = `
    <div class="budget-line">
      <span>${escapeHtml(store.t('foodUnitLine'))}</span>
      <span class="tabular-nums">${escapeHtml(formatCurrency(unitPrice))}</span>
    </div>
    <div class="budget-total">
      <span>${escapeHtml(store.t('foodRateTotalLine'))}</span>
      <strong class="tabular-nums">${escapeHtml(formatCurrency(total))}</strong>
    </div>
  `;
}

function syncFoodBookingForm() {
  const { foods, authUser, credUser, demoUser } = store.getState();
  const selected = getSelectedFood();
  if (selected) foodDraft.itemId = selected.id;

  const activeName =
    authUser?.displayName || credUser?.displayName || demoUser?.displayName || '';
  if (!foodDraft.contactName && activeName) {
    foodDraft.contactName = activeName;
  }

  const selectEl = document.getElementById('foodBookingSelect');
  if (selectEl) {
    selectEl.innerHTML = foods
      .map(
        (f) =>
          `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)} (${escapeHtml(
            f.region
          )} · ${escapeHtml(formatCurrency(f.price))})</option>`
      )
      .join('');
    selectEl.value = foodDraft.itemId;
  }

  const dateEl = document.getElementById('foodBookingDateInput');
  if (dateEl && dateEl !== document.activeElement) dateEl.value = foodDraft.serviceDate;

  const qtyEl = document.getElementById('foodBookingQtyInput');
  if (qtyEl && qtyEl !== document.activeElement) qtyEl.value = String(foodDraft.quantity);

  const nameEl = document.getElementById('foodBookingNameInput');
  if (nameEl && nameEl !== document.activeElement) nameEl.value = foodDraft.contactName;

  const phoneEl = document.getElementById('foodBookingPhoneInput');
  if (phoneEl && phoneEl !== document.activeElement) phoneEl.value = foodDraft.contactPhone;

  const notesEl = document.getElementById('foodBookingNotesInput');
  if (notesEl && notesEl !== document.activeElement) notesEl.value = foodDraft.notes;
}

function renderFoodBookingsList() {
  const host = document.getElementById('foodBookingsList');
  if (!host) return;
  const { foodBookings, lang, foods } = store.getState();

  if (!foodBookings.length) {
    host.innerHTML = `<p class="muted-empty">${escapeHtml(store.t('foodListEmpty'))}</p>`;
    return;
  }

  host.innerHTML = foodBookings
    .map((bk) => {
      const isCancelled = bk.status === 'cancelled';
      const statusLabel = isCancelled ? store.t('foodStatusCancelled') : store.t('foodStatusPending');
      const foodObj = foods.find((f) => f.id === bk.itemId);
      const waContact = String(bk.itemContact || foodObj?.contact || '6281234567001').replace(
        /[^0-9]/g,
        ''
      );
      const waMessage =
        lang === 'en'
          ? `Hello, I would like to confirm culinary order ${bk.bookingCode} (${bk.itemName} × ${bk.quantity}) for ${bk.serviceDate}. Name: ${bk.contactName}.`
          : `Halo UMKM ${bk.itemName}, saya ingin konfirmasi pesanan ${bk.bookingCode} sejumlah ${bk.quantity} porsi/paket untuk tanggal ${bk.serviceDate}. Atas nama: ${bk.contactName}.`;

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
        lang === 'en' ? 'portion(s)' : 'porsi/paket'
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
                  ? `<a
                      class="btn btn-outline btn-sm"
                      href="https://wa.me/${encodeURIComponent(waContact)}?text=${encodeURIComponent(
                        waMessage
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHtml(store.t('foodWhatsappBtn'))}
                    </a>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      data-cancel-food-booking="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carCancelBtn'))}
                    </button>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger-outline btn-sm"
                data-delete-food-booking="${escapeHtml(bk.id)}"
              >
                ${escapeHtml(store.t('carDeleteBtn'))}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-cancel-food-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-food-booking');
      if (id) {
        store.cancelFoodBooking(id);
        showToast(store.t('toastFoodCancelled'));
      }
    });
  });

  host.querySelectorAll('button[data-delete-food-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-food-booking');
      if (id) store.deleteFoodBooking(id);
    });
  });
}

export function initFoodBookingControls() {
  document.getElementById('foodBookingSelect')?.addEventListener('change', (e) => {
    foodDraft.itemId = e.target.value;
    renderCulinaryAndStays();
  });

  document.getElementById('foodBookingDateInput')?.addEventListener('change', (e) => {
    foodDraft.serviceDate = e.target.value;
  });

  document.getElementById('foodBookingQtyInput')?.addEventListener('input', (e) => {
    foodDraft.quantity = Math.min(50, Math.max(1, Number(e.target.value) || 1));
    renderFoodEstimate();
  });

  document.getElementById('foodBookingNameInput')?.addEventListener('input', (e) => {
    foodDraft.contactName = e.target.value;
  });

  document.getElementById('foodBookingPhoneInput')?.addEventListener('input', (e) => {
    foodDraft.contactPhone = e.target.value;
  });

  document.getElementById('foodBookingNotesInput')?.addEventListener('input', (e) => {
    foodDraft.notes = e.target.value;
  });

  document.getElementById('foodBookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const food = getSelectedFood();
    if (!food) return;

    const cleanName = foodDraft.contactName.trim();
    const cleanPhone = foodDraft.contactPhone.trim();
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(foodDraft.quantity) || 0)));

    if (
      cleanName.length < 1 ||
      cleanPhone.length < 6 ||
      cleanPhone.length > 24 ||
      !foodDraft.serviceDate
    ) {
      showToast(store.t('toastFoodInvalidForm'));
      return;
    }

    const created = store.createFoodBooking({
      itemId: food.id,
      itemName: food.name,
      itemRegion: food.region,
      itemContact: food.contact,
      serviceDate: foodDraft.serviceDate,
      quantity: qty,
      unitPrice: Math.max(0, Number(food.price) || 0),
      contactName: cleanName,
      contactPhone: cleanPhone,
      notes: foodDraft.notes.trim(),
    });

    foodDraft.notes = '';
    const notesEl = document.getElementById('foodBookingNotesInput');
    if (notesEl) notesEl.value = '';

    showToast(store.t('toastFoodBooked', { code: created.bookingCode }));
  });
}

export function renderCulinaryAndStays() {
  const { foods } = store.getState();

  const foodHost = document.getElementById('foodCards');
  if (foodHost) {
    if (!foods.length) {
      foodHost.innerHTML = `<div class="empty-state">${escapeHtml(store.t('noDestMatch'))}</div>`;
    } else {
      const selected = getSelectedFood();
      foodHost.innerHTML = foods
        .map((f) => {
          const isSelected = selected?.id === f.id;
          const waText = encodeURIComponent(`Halo, saya ingin bertanya mengenai ${f.name} (${f.region}).`);
          const cleanPhone = String(f.contact || '').replace(/\D/g, '');
          return `
            <article class="catalog-card ${isSelected ? 'is-selected' : ''}">
              <div class="catalog-status ${f.verified ? 'is-verified' : ''}">
                <span>${f.verified ? '✓' : '•'}</span>
                <span>${escapeHtml(f.status)}</span>
              </div>
              <h3>${escapeHtml(f.name)}</h3>
              <p class="catalog-meta">
                <span>${escapeHtml(f.category)}</span> · <span>${escapeHtml(f.region)}</span>
              </p>
              <p class="catalog-note">${escapeHtml(f.source)}</p>
              <div class="catalog-footer">
                <span class="card-price tabular-nums">${escapeHtml(formatCurrency(f.price))}</span>
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
                    data-select-food="${escapeHtml(f.id)}"
                  >
                    ${escapeHtml(isSelected ? store.t('foodBookSelectedBtn') : store.t('foodBookBtn'))}
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join('');

      foodHost.querySelectorAll('button[data-select-food]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-select-food');
          if (!id) return;
          foodDraft.itemId = id;
          renderCulinaryAndStays();
          document.getElementById('foodBookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });
    }
  }

  syncFoodBookingForm();
  renderFoodEstimate();
  renderFoodBookingsList();
}
