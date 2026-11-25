import { categories, categoryLabelsEn, regions } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml, formatCurrency, sanitizeUrl } from '../utils/format.js';
import { showToast } from '../utils/toast.js';
import { attachImageFallback } from './ExploreAndGallery.js';
import { openDetailModal } from './Modals.js';

const destDraft = {
  itemId: 'd2',
  serviceDate: new Date().toISOString().slice(0, 10),
  quantity: 2,
  contactName: '',
  contactPhone: '',
  notes: '',
};

export function getCategoryLabel(cat, lang) {
  if (lang === 'en') {
    return categoryLabelsEn[cat] || cat;
  }
  return cat;
}

function getSelectedDestination() {
  const { destinations } = store.getState();
  return destinations.find((d) => d.id === destDraft.itemId) || destinations[0];
}

export function selectDestinationForBooking(destId) {
  if (!destId) return;
  destDraft.itemId = destId;
  renderDestinationBookingWorkspace();
  requestAnimationFrame(() => {
    document.getElementById('destBookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function renderDestinationEstimate() {
  const box = document.getElementById('destEstimateBox');
  if (!box) return;
  const dest = getSelectedDestination();
  const qty = Math.min(50, Math.max(1, Math.trunc(Number(destDraft.quantity) || 1)));
  const unitPrice = Math.max(0, Number(dest?.cost) || 0);
  const total = unitPrice * qty;

  box.innerHTML = `
    <div class="budget-line">
      <span>${escapeHtml(store.t('destUnitLine'))}</span>
      <span class="tabular-nums">${escapeHtml(
        unitPrice === 0 ? store.t('freeEntry') : formatCurrency(unitPrice)
      )}</span>
    </div>
    <div class="budget-total">
      <span>${escapeHtml(store.t('destRateTotalLine'))}</span>
      <strong class="tabular-nums">${escapeHtml(
        total === 0 ? store.t('freeEntry') : formatCurrency(total)
      )}</strong>
    </div>
  `;
}

function syncDestinationBookingForm() {
  const { destinations, authUser, credUser, demoUser } = store.getState();
  const selected = getSelectedDestination();
  if (selected) destDraft.itemId = selected.id;

  const activeName =
    authUser?.displayName || credUser?.displayName || demoUser?.displayName || '';
  if (!destDraft.contactName && activeName) {
    destDraft.contactName = activeName;
  }

  const selectEl = document.getElementById('destBookingSelect');
  if (selectEl) {
    selectEl.innerHTML = destinations
      .map((d) => {
        const feeText = d.cost === 0 ? store.t('freeEntry') : formatCurrency(d.cost);
        return `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} (${escapeHtml(
          d.region
        )} · ${escapeHtml(feeText)})</option>`;
      })
      .join('');
    selectEl.value = destDraft.itemId;
  }

  const dateEl = document.getElementById('destBookingDateInput');
  if (dateEl && dateEl !== document.activeElement) dateEl.value = destDraft.serviceDate;

  const qtyEl = document.getElementById('destBookingQtyInput');
  if (qtyEl && qtyEl !== document.activeElement) qtyEl.value = String(destDraft.quantity);

  const nameEl = document.getElementById('destBookingNameInput');
  if (nameEl && nameEl !== document.activeElement) nameEl.value = destDraft.contactName;

  const phoneEl = document.getElementById('destBookingPhoneInput');
  if (phoneEl && phoneEl !== document.activeElement) phoneEl.value = destDraft.contactPhone;

  const notesEl = document.getElementById('destBookingNotesInput');
  if (notesEl && notesEl !== document.activeElement) notesEl.value = destDraft.notes;
}

function renderDestinationBookingsList() {
  const host = document.getElementById('destBookingsList');
  if (!host) return;
  const { destinationBookings, lang } = store.getState();

  if (!destinationBookings.length) {
    host.innerHTML = `<p class="muted-empty">${escapeHtml(store.t('destListEmpty'))}</p>`;
    return;
  }

  host.innerHTML = destinationBookings
    .map((bk) => {
      const isCancelled = bk.status === 'cancelled';
      const statusLabel = isCancelled ? store.t('destStatusCancelled') : store.t('destStatusPending');
      const totalLabel =
        Number(bk.totalEstimate) === 0 ? store.t('freeEntry') : formatCurrency(bk.totalEstimate);

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
            <strong class="price-text tabular-nums">${escapeHtml(totalLabel)}</strong>
            <div class="list-row-actions">
              ${
                !isCancelled
                  ? `<button
                      type="button"
                      class="btn btn-outline btn-sm"
                      data-cancel-dest-booking="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carCancelBtn'))}
                    </button>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger-outline btn-sm"
                data-delete-dest-booking="${escapeHtml(bk.id)}"
              >
                ${escapeHtml(store.t('carDeleteBtn'))}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-cancel-dest-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-dest-booking');
      if (id) {
        store.cancelDestinationBooking(id);
        showToast(store.t('toastDestCancelled'));
      }
    });
  });

  host.querySelectorAll('button[data-delete-dest-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-dest-booking');
      if (id) store.deleteDestinationBooking(id);
    });
  });
}

function renderDestinationBookingWorkspace() {
  syncDestinationBookingForm();
  renderDestinationEstimate();
  renderDestinationBookingsList();
}

export function initDestinationFilterControls() {
  const searchInput = document.getElementById('searchInput');
  const regionFilter = document.getElementById('regionFilter');
  const sortFilter = document.getElementById('sortFilter');
  const resetBtn = document.getElementById('resetFiltersBtn');

  searchInput?.addEventListener('input', (e) => {
    store.setFilter({ search: e.target.value });
  });

  regionFilter?.addEventListener('change', (e) => {
    store.setFilter({ region: e.target.value });
  });

  sortFilter?.addEventListener('change', (e) => {
    store.setFilter({ sort: e.target.value });
  });

  resetBtn?.addEventListener('click', () => {
    store.resetFilters();
  });

  document.getElementById('destBookingSelect')?.addEventListener('change', (e) => {
    destDraft.itemId = e.target.value;
    renderDestinationEstimate();
  });

  document.getElementById('destBookingDateInput')?.addEventListener('change', (e) => {
    destDraft.serviceDate = e.target.value;
  });

  document.getElementById('destBookingQtyInput')?.addEventListener('input', (e) => {
    destDraft.quantity = Math.min(50, Math.max(1, Number(e.target.value) || 1));
    renderDestinationEstimate();
  });

  document.getElementById('destBookingNameInput')?.addEventListener('input', (e) => {
    destDraft.contactName = e.target.value;
  });

  document.getElementById('destBookingPhoneInput')?.addEventListener('input', (e) => {
    destDraft.contactPhone = e.target.value;
  });

  document.getElementById('destBookingNotesInput')?.addEventListener('input', (e) => {
    destDraft.notes = e.target.value;
  });

  document.getElementById('destBookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const dest = getSelectedDestination();
    if (!dest) return;

    const cleanName = destDraft.contactName.trim();
    const cleanPhone = destDraft.contactPhone.trim();
    const qty = Math.min(50, Math.max(1, Math.trunc(Number(destDraft.quantity) || 0)));

    if (
      cleanName.length < 1 ||
      cleanPhone.length < 6 ||
      cleanPhone.length > 24 ||
      !destDraft.serviceDate
    ) {
      showToast(store.t('toastDestInvalidForm'));
      return;
    }

    const created = store.createDestinationBooking({
      itemId: dest.id,
      itemName: dest.name,
      itemRegion: dest.region,
      serviceDate: destDraft.serviceDate,
      quantity: qty,
      unitPrice: Math.max(0, Number(dest.cost) || 0),
      contactName: cleanName,
      contactPhone: cleanPhone,
      notes: destDraft.notes.trim(),
    });

    destDraft.notes = '';
    const notesEl = document.getElementById('destBookingNotesInput');
    if (notesEl) notesEl.value = '';

    showToast(store.t('toastDestBooked', { code: created.bookingCode }));
  });
}

export function renderDestinationsSection() {
  const state = store.getState();
  const { lang, destinations, favorites, filters } = state;

  const heroDestCount = document.getElementById('heroDestCount');
  const heroRegionCount = document.getElementById('heroRegionCount');
  const heroCategoryCount = document.getElementById('heroCategoryCount');
  if (heroDestCount) heroDestCount.textContent = String(destinations.length);
  if (heroRegionCount) heroRegionCount.textContent = String(regions.length);
  if (heroCategoryCount) heroCategoryCount.textContent = String(categories.length);

  // Category Tabs
  const tabsHost = document.getElementById('categoryTabs');
  if (tabsHost) {
    const allLabel = store.t('allCategories');
    const tabItems = [
      { value: '', label: allLabel },
      ...categories.map((c) => ({ value: c, label: getCategoryLabel(c, lang) })),
    ];
    tabsHost.innerHTML = tabItems
      .map(
        (item) => `
          <button
            type="button"
            role="tab"
            aria-selected="${filters.category === item.value ? 'true' : 'false'}"
            class="tab-btn ${filters.category === item.value ? 'is-active' : ''}"
            data-cat-tab="${escapeHtml(item.value)}"
          >
            ${escapeHtml(item.label)}
          </button>
        `
      )
      .join('');

    tabsHost.querySelectorAll('button[data-cat-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setFilter({ category: btn.getAttribute('data-cat-tab') || '' });
      });
    });
  }

  // Sync select options & values
  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value !== filters.search) {
    searchInput.value = filters.search;
  }

  const regionFilter = document.getElementById('regionFilter');
  if (regionFilter) {
    regionFilter.innerHTML =
      `<option value="">${escapeHtml(store.t('allRegions'))}</option>` +
      regions.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join('');
    regionFilter.value = filters.region;
  }

  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    sortFilter.innerHTML = `
      <option value="name">${escapeHtml(store.t('sortName'))}</option>
      <option value="costAsc">${escapeHtml(store.t('sortCostAsc'))}</option>
      <option value="costDesc">${escapeHtml(store.t('sortCostDesc'))}</option>
    `;
    sortFilter.value = filters.sort;
  }

  const resetBtn = document.getElementById('resetFiltersBtn');
  const hasActiveFilter = Boolean(filters.search || filters.region || filters.category || filters.sort !== 'name');
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', !hasActiveFilter);
  }

  // Filter & Sort destinations
  const q = filters.search.trim().toLowerCase();
  const filtered = destinations
    .filter((d) => {
      const hay = `${d.name} ${d.desc} ${d.region} ${d.category}`.toLowerCase();
      const matchQuery = !q || hay.includes(q);
      const matchRegion = !filters.region || d.region === filters.region;
      const matchCat = !filters.category || d.category === filters.category;
      return matchQuery && matchRegion && matchCat;
    })
    .sort((a, b) => {
      if (filters.sort === 'costAsc') return a.cost - b.cost;
      if (filters.sort === 'costDesc') return b.cost - a.cost;
      return a.name.localeCompare(b.name);
    });

  const countEl = document.getElementById('destResultCount');
  if (countEl) {
    countEl.textContent = store.t('showingCount', {
      shown: filtered.length,
      total: destinations.length,
    });
  }

  const cardsHost = document.getElementById('destinationCards');
  if (cardsHost) {
    if (!filtered.length) {
      cardsHost.innerHTML = `<div class="empty-state">${escapeHtml(store.t('noDestMatch'))}</div>`;
    } else {
      cardsHost.innerHTML = filtered
        .map((d) => {
          const isFav = favorites.includes(d.id);
          const photoUrl = sanitizeUrl(d.photo);
          const costText =
            d.cost === 0
              ? store.t('freeEntry')
              : `${store.t('estCostPrefix')} ${formatCurrency(d.cost)}`;
          const catLabel = getCategoryLabel(d.category, lang);

          return `
            <article class="dest-card">
              <div class="card-media">
                ${
                  photoUrl
                    ? `<img
                        src="${escapeHtml(photoUrl)}"
                        alt="${escapeHtml(d.name)}"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                        data-fallback-title="${escapeHtml(d.name)}"
                      />`
                    : `<div class="img-fallback"><span>${escapeHtml(d.name)}</span></div>`
                }
                <button
                  type="button"
                  class="fav-btn ${isFav ? 'is-saved' : ''}"
                  data-fav-id="${escapeHtml(d.id)}"
                  aria-label="${escapeHtml(isFav ? store.t('detailRemoveFav') : store.t('detailAddFav'))}"
                  title="${escapeHtml(isFav ? store.t('detailRemoveFav') : store.t('detailAddFav'))}"
                >
                  ${isFav ? '♥' : '♡'}
                </button>
              </div>
              <div class="card-body">
                <div class="card-meta">
                  <span>${escapeHtml(catLabel)}</span>
                  <span aria-hidden="true">·</span>
                  <span>${escapeHtml(d.region)}</span>
                </div>
                <h3>${escapeHtml(d.name)}</h3>
                <p class="card-desc">${escapeHtml(d.desc)}</p>
                <div class="card-footer">
                  <span class="card-price tabular-nums">${escapeHtml(costText)}</span>
                  <div class="card-actions">
                    <button type="button" class="btn btn-light btn-sm" data-book-dest-id="${escapeHtml(d.id)}">
                      ${escapeHtml(store.t('destBookBtn'))}
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-add-trip-id="${escapeHtml(d.id)}">
                      ${escapeHtml(store.t('btnAddTrip'))}
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" data-detail-id="${escapeHtml(d.id)}">
                      ${escapeHtml(store.t('btnDetail'))}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          `;
        })
        .join('');

      attachImageFallback(cardsHost);

      cardsHost.querySelectorAll('button[data-fav-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-fav-id');
          if (!id) return;
          const added = store.toggleFavorite(id);
          showToast(added ? store.t('toastSavedFav') : store.t('toastRemovedFav'));
        });
      });

      cardsHost.querySelectorAll('button[data-book-dest-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-book-dest-id');
          if (id) selectDestinationForBooking(id);
        });
      });

      cardsHost.querySelectorAll('button[data-detail-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-detail-id');
          if (id) openDetailModal(id);
        });
      });

      cardsHost.querySelectorAll('button[data-add-trip-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-add-trip-id');
          if (!id) return;
          store.addActivity(id);
          showToast(store.t('toastActivityAdded'));
        });
      });
    }
  }

  renderDestinationBookingWorkspace();
}
