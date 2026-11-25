import { categories } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml, formatCurrency } from '../utils/format.js';
import { showToast } from '../utils/toast.js';
import { getCategoryLabel } from './Destinations.js';
import { openDetailModal } from './Modals.js';

let confirmingClearFavs = false;

export function calculateBudgetBreakdown() {
  const { tripMeta, budget } = store.getState();
  const days = Math.max(1, Number(tripMeta.days) || 1);
  const people = Math.max(1, Number(tripMeta.travellers) || 1);
  const nights = Math.max(0, days - 1);

  const transport = Math.max(0, Number(budget.transport) || 0);
  const hotelTotal = Math.max(0, Number(budget.hotel) || 0) * nights;
  const mealTotal = Math.max(0, Number(budget.meal) || 0) * days * people;
  const ticketsTotal = Math.max(0, Number(budget.tickets) || 0) * days * people;
  const total = transport + hotelTotal + mealTotal + ticketsTotal;
  const perPerson = Math.round(total / people);

  return { days, nights, people, transport, hotelTotal, mealTotal, ticketsTotal, total, perPerson };
}

function buildTripSummaryText() {
  const { tripMeta, activities, destinations } = store.getState();
  const breakdown = calculateBudgetBreakdown();
  const lines = [
    `Discover Aceh — ${tripMeta.name || 'Jelajah Aceh'}`,
    `${store.t('lblTripDate')}: ${tripMeta.date || '-'}`,
    `${breakdown.days} ${store.t('dayLabel')} · ${breakdown.people} ${store.t('lblTravellers')}`,
    '',
    `${store.t('planTitle1')}:`,
  ];

  if (!activities.length) {
    lines.push(`- ${store.t('emptyActivities')}`);
  } else {
    activities.forEach((a) => {
      const dest = destinations.find((d) => d.id === a.destinationId);
      const dayNum = Math.min(a.day, breakdown.days);
      lines.push(`- ${store.t('dayLabel')} ${dayNum}: ${dest ? `${dest.name} (${dest.region})` : 'Destinasi'}`);
    });
  }

  lines.push('', `${store.t('budgetTotalLabel')}: ${formatCurrency(breakdown.total)}`);
  lines.push(`${store.t('budgetPerPersonLabel')}: ${formatCurrency(breakdown.perPerson)}`);
  return lines.join('\n');
}

function printItineraryInPage() {
  const { tripMeta, activities, destinations } = store.getState();
  const breakdown = calculateBudgetBreakdown();
  const sheet = document.getElementById('printSheet');
  if (!sheet) return;

  const stopsHtml = activities.length
    ? activities
        .map((a) => {
          const dest = destinations.find((d) => d.id === a.destinationId);
          return `<li><strong>${escapeHtml(store.t('dayLabel'))} ${Math.min(a.day, breakdown.days)}</strong> — ${escapeHtml(
            dest ? `${dest.name} (${dest.region})` : '-'
          )}</li>`;
        })
        .join('')
    : `<li>${escapeHtml(store.t('emptyActivities'))}</li>`;

  sheet.innerHTML = `
    <h1 style="margin-bottom:4px;">Discover Aceh — ${escapeHtml(tripMeta.name || 'Jelajah Aceh')}</h1>
    <p style="margin-bottom:16px;color:#444;">
      ${escapeHtml(store.t('lblTripDate'))}: ${escapeHtml(tripMeta.date || '-')} ·
      ${breakdown.days} ${escapeHtml(store.t('dayLabel'))} · ${breakdown.people} ${escapeHtml(store.t('lblTravellers'))}
    </p>
    <h2>${escapeHtml(store.t('planTitle1'))}</h2>
    <ul>${stopsHtml}</ul>
    <h2 style="margin-top:20px;">${escapeHtml(store.t('planTitle2'))}</h2>
    <p><strong>${escapeHtml(store.t('budgetTotalLabel'))}:</strong> ${escapeHtml(formatCurrency(breakdown.total))}</p>
    <p><strong>${escapeHtml(store.t('budgetPerPersonLabel'))}:</strong> ${escapeHtml(formatCurrency(breakdown.perPerson))}</p>
  `;
  window.print();
}

export function initPlannerControls() {
  const tripName = document.getElementById('tripName');
  const tripDate = document.getElementById('tripDate');
  const tripDays = document.getElementById('tripDays');
  const travellers = document.getElementById('travellers');
  const addActivityBtn = document.getElementById('addActivityBtn');
  const saveTripBtn = document.getElementById('saveTripBtn');
  const shareTripBtn = document.getElementById('shareTripBtn');
  const printTripBtn = document.getElementById('printTripBtn');

  const transportInput = document.getElementById('transportInput');
  const hotelInput = document.getElementById('hotelInput');
  const mealInput = document.getElementById('mealInput');
  const ticketsInput = document.getElementById('ticketsInput');

  const interestFilter = document.getElementById('interestFilter');
  const recDays = document.getElementById('recDays');
  const recBudget = document.getElementById('recBudget');

  const clearFavsBtn = document.getElementById('clearFavoritesBtn');

  tripName?.addEventListener('input', (e) => store.setTripMeta({ name: e.target.value }));
  tripDate?.addEventListener('change', (e) => store.setTripMeta({ date: e.target.value }));
  tripDays?.addEventListener('change', (e) => store.setTripMeta({ days: Number(e.target.value) || 1 }));
  travellers?.addEventListener('input', (e) =>
    store.setTripMeta({ travellers: Math.max(1, Number(e.target.value) || 1) })
  );

  addActivityBtn?.addEventListener('click', () => {
    const destId = document.getElementById('activitySelect')?.value;
    const day = document.getElementById('activityDaySelect')?.value;
    if (!destId) return;
    store.addActivity(destId, day);
    showToast(store.t('toastActivityAdded'));
  });

  saveTripBtn?.addEventListener('click', () => {
    const breakdown = calculateBudgetBreakdown();
    store.saveCurrentTrip(breakdown.total);
    showToast(store.t('toastTripSaved'));
  });

  shareTripBtn?.addEventListener('click', async () => {
    const text = buildTripSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Discover Aceh Itinerary', text });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(store.t('toastSummaryCopied'));
    } catch {
      printItineraryInPage();
    }
  });

  printTripBtn?.addEventListener('click', printItineraryInPage);

  transportInput?.addEventListener('input', (e) => store.setBudget({ transport: Number(e.target.value) || 0 }));
  hotelInput?.addEventListener('input', (e) => store.setBudget({ hotel: Number(e.target.value) || 0 }));
  mealInput?.addEventListener('input', (e) => store.setBudget({ meal: Number(e.target.value) || 0 }));
  ticketsInput?.addEventListener('input', (e) => store.setBudget({ tickets: Number(e.target.value) || 0 }));

  interestFilter?.addEventListener('change', renderRecommendations);
  recDays?.addEventListener('change', renderRecommendations);
  recBudget?.addEventListener('input', renderRecommendations);

  clearFavsBtn?.addEventListener('click', () => {
    if (!confirmingClearFavs) {
      confirmingClearFavs = true;
      renderFavoritesPanel();
      return;
    }
    confirmingClearFavs = false;
    store.clearFavorites();
    showToast(store.t('toastRemovedFav'));
  });
}

function renderRecommendations() {
  const { lang, packages } = store.getState();
  const interestEl = document.getElementById('interestFilter');
  const recDaysEl = document.getElementById('recDays');
  const recBudgetEl = document.getElementById('recBudget');
  const host = document.getElementById('recommendationsList');
  if (!interestEl || !recDaysEl || !recBudgetEl || !host) return;

  const selectedInterest = interestEl.value || 'all';
  const maxDays = Number(recDaysEl.value) || 3;
  const maxBudget = Number(recBudgetEl.value) || 0;

  const matched = packages.filter(
    (p) =>
      p.duration <= maxDays &&
      p.cost <= maxBudget &&
      (selectedInterest === 'all' || (p.interests || []).includes(selectedInterest))
  );

  if (!matched.length) {
    host.innerHTML = `<p class="list-row-sub">${escapeHtml(store.t('noPackagesMatch'))}</p>`;
    return;
  }

  host.innerHTML = matched
    .map((p) => {
      const interestsText = (p.interests || []).map((i) => getCategoryLabel(i, lang)).join(' · ');
      return `
        <div class="package-row">
          <div class="package-head">
            <strong>${escapeHtml(p.name)}</strong>
            <span class="package-cost tabular-nums">${escapeHtml(formatCurrency(p.cost))}</span>
          </div>
          <p class="list-row-sub">${escapeHtml(p.desc)}</p>
          <div class="list-row">
            <span class="list-row-sub tabular-nums">${p.duration} ${escapeHtml(store.t('dayLabel'))} · ${escapeHtml(
        interestsText
      )}</span>
            <button type="button" class="btn btn-light btn-sm" data-use-pkg="${escapeHtml(p.id)}">
              ${escapeHtml(store.t('usePackage'))}
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-use-pkg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-use-pkg');
      const pkg = packages.find((x) => x.id === id);
      if (!pkg) return;
      store.loadPackageIntoTrip(pkg);
      showToast(store.t('toastPackageLoaded', { name: pkg.name }));
    });
  });
}

function renderFavoritesPanel() {
  const { favorites, destinations } = store.getState();
  const host = document.getElementById('favoritesList');
  const actionsHost = document.getElementById('favoritesActions');
  if (!host || !actionsHost) return;

  const favDestinations = favorites
    .map((fid) => destinations.find((d) => d.id === fid))
    .filter(Boolean);

  if (!favDestinations.length) {
    confirmingClearFavs = false;
    host.innerHTML = `<p class="list-row-sub">${escapeHtml(store.t('emptyFavorites'))}</p>`;
    actionsHost.classList.add('hidden');
    return;
  }

  actionsHost.classList.remove('hidden');
  host.innerHTML = favDestinations
    .map(
      (d) => `
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${escapeHtml(d.name)}</span>
          <span class="list-row-sub">${escapeHtml(d.region)}</span>
        </div>
        <div class="list-row-actions">
          <button type="button" class="btn btn-outline btn-sm" data-fav-detail="${escapeHtml(d.id)}">
            ${escapeHtml(store.t('btnDetail'))}
          </button>
          <button type="button" class="btn btn-light btn-sm" data-fav-add="${escapeHtml(d.id)}">
            ${escapeHtml(store.t('btnAddTrip'))}
          </button>
          <button type="button" class="btn btn-outline btn-sm" data-fav-remove="${escapeHtml(d.id)}" aria-label="Hapus">
            ×
          </button>
        </div>
      </div>
    `
    )
    .join('');

  const clearBtn = document.getElementById('clearFavoritesBtn');
  if (clearBtn) {
    clearBtn.textContent = confirmingClearFavs ? store.t('confirmClearFavs') : store.t('btnClearFavs');
    clearBtn.className = confirmingClearFavs ? 'btn btn-danger-outline btn-sm' : 'btn btn-outline btn-sm';
  }

  host.querySelectorAll('button[data-fav-detail]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-fav-detail');
      if (id) openDetailModal(id);
    });
  });

  host.querySelectorAll('button[data-fav-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-fav-add');
      if (!id) return;
      store.addActivity(id);
      showToast(store.t('toastActivityAdded'));
    });
  });

  host.querySelectorAll('button[data-fav-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-fav-remove');
      if (!id) return;
      store.toggleFavorite(id);
      showToast(store.t('toastRemovedFav'));
    });
  });
}

export function renderPlannerSection() {
  const { lang, destinations, activities, savedTrips, tripMeta, budget } = store.getState();

  // Sync trip metadata fields
  const tripName = document.getElementById('tripName');
  const tripDate = document.getElementById('tripDate');
  const tripDays = document.getElementById('tripDays');
  const travellers = document.getElementById('travellers');

  if (tripName && tripName.value !== tripMeta.name) tripName.value = tripMeta.name;
  if (tripDate && tripDate.value !== tripMeta.date) tripDate.value = tripMeta.date;
  if (tripDays && Number(tripDays.value) !== Number(tripMeta.days)) tripDays.value = String(tripMeta.days);
  if (travellers && Number(travellers.value) !== Number(tripMeta.travellers)) {
    travellers.value = String(tripMeta.travellers);
  }

  // Destination & Day dropdowns
  const activitySelect = document.getElementById('activitySelect');
  if (activitySelect) {
    const prev = activitySelect.value;
    activitySelect.innerHTML = destinations
      .map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} · ${escapeHtml(d.region)}</option>`)
      .join('');
    if (prev && destinations.some((d) => d.id === prev)) {
      activitySelect.value = prev;
    }
  }

  const dayCount = Math.max(1, Number(tripMeta.days) || 3);
  const activityDaySelect = document.getElementById('activityDaySelect');
  if (activityDaySelect) {
    const prevDay = activityDaySelect.value;
    activityDaySelect.innerHTML = Array.from({ length: dayCount }, (_, idx) => {
      const dNum = idx + 1;
      return `<option value="${dNum}">${escapeHtml(store.t('dayLabel'))} ${dNum}</option>`;
    }).join('');
    if (prevDay && Number(prevDay) <= dayCount) {
      activityDaySelect.value = prevDay;
    }
  }

  // Activities list
  const activityHost = document.getElementById('activityList');
  if (activityHost) {
    if (!activities.length) {
      activityHost.innerHTML = `<p class="list-row-sub">${escapeHtml(store.t('emptyActivities'))}</p>`;
    } else {
      activityHost.innerHTML = activities
        .map((a) => {
          const dest = destinations.find((d) => d.id === a.destinationId);
          const selectedDay = Math.min(a.day, dayCount);
          const dayOptions = Array.from({ length: dayCount }, (_, idx) => {
            const dNum = idx + 1;
            return `<option value="${dNum}" ${dNum === selectedDay ? 'selected' : ''}>${escapeHtml(
              store.t('dayLabel')
            )} ${dNum}</option>`;
          }).join('');
          return `
            <div class="list-row">
              <div class="list-row-main">
                <span class="list-row-title">${escapeHtml(dest?.name || 'Destinasi')}</span>
                <span class="list-row-sub">${escapeHtml(dest?.region || '')}</span>
              </div>
              <div class="list-row-actions">
                <select class="day-select-inline" data-act-day="${escapeHtml(a.id)}" aria-label="${escapeHtml(
            store.t('dayLabel')
          )}">
                  ${dayOptions}
                </select>
                <button type="button" class="btn btn-outline btn-sm" data-act-remove="${escapeHtml(a.id)}" aria-label="${escapeHtml(
            store.t('btnDelete')
          )}">
                  ×
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      activityHost.querySelectorAll('select[data-act-day]').forEach((sel) => {
        sel.addEventListener('change', () => {
          const id = sel.getAttribute('data-act-day');
          if (id) store.updateActivityDay(id, Number(sel.value));
        });
      });

      activityHost.querySelectorAll('button[data-act-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-act-remove');
          if (id) store.removeActivity(id);
        });
      });
    }
  }

  // Saved Trips block
  const savedHost = document.getElementById('savedTripsSection');
  if (savedHost) {
    if (!savedTrips.length) {
      savedHost.innerHTML = `
        <p class="saved-trips-title">${escapeHtml(store.t('savedTripsHeading'))}</p>
        <p class="list-row-sub">${escapeHtml(store.t('noSavedTrips'))}</p>
      `;
    } else {
      savedHost.innerHTML = `
        <p class="saved-trips-title">${escapeHtml(store.t('savedTripsHeading'))}</p>
        ${savedTrips
          .slice(0, 4)
          .map(
            (t) => `
          <div class="list-row">
            <div class="list-row-main">
              <span class="list-row-title">${escapeHtml(t.name)}</span>
              <span class="list-row-sub tabular-nums">${t.days} ${escapeHtml(store.t('dayLabel'))} · ${escapeHtml(
              formatCurrency(t.totalEstimate)
            )}</span>
            </div>
            <div class="list-row-actions">
              <button type="button" class="btn btn-light btn-sm" data-load-trip="${escapeHtml(t.id)}">${escapeHtml(
              store.t('btnLoad')
            )}</button>
              <button type="button" class="btn btn-outline btn-sm" data-del-trip="${escapeHtml(t.id)}">×</button>
            </div>
          </div>
        `
          )
          .join('')}
      `;

      savedHost.querySelectorAll('button[data-load-trip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-load-trip');
          if (id) store.loadSavedTrip(id);
        });
      });

      savedHost.querySelectorAll('button[data-del-trip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-del-trip');
          if (id) store.deleteSavedTrip(id);
        });
      });
    }
  }

  // Budget inputs & live summary
  const transportInput = document.getElementById('transportInput');
  const hotelInput = document.getElementById('hotelInput');
  const mealInput = document.getElementById('mealInput');
  const ticketsInput = document.getElementById('ticketsInput');

  if (transportInput && Number(transportInput.value) !== budget.transport) transportInput.value = String(budget.transport);
  if (hotelInput && Number(hotelInput.value) !== budget.hotel) hotelInput.value = String(budget.hotel);
  if (mealInput && Number(mealInput.value) !== budget.meal) mealInput.value = String(budget.meal);
  if (ticketsInput && Number(ticketsInput.value) !== budget.tickets) ticketsInput.value = String(budget.tickets);

  const breakdown = calculateBudgetBreakdown();
  const budgetHost = document.getElementById('budgetBreakdown');
  if (budgetHost) {
    budgetHost.innerHTML = `
      <div class="budget-line">
        <span>${escapeHtml(store.t('budgetTransportLine'))}</span>
        <span class="tabular-nums">${escapeHtml(formatCurrency(breakdown.transport))}</span>
      </div>
      <div class="budget-line">
        <span>${escapeHtml(store.t('budgetHotelLine', { nights: breakdown.nights }))}</span>
        <span class="tabular-nums">${escapeHtml(formatCurrency(breakdown.hotelTotal))}</span>
      </div>
      <div class="budget-line">
        <span>${escapeHtml(store.t('budgetMealsLine', { days: breakdown.days, people: breakdown.people }))}</span>
        <span class="tabular-nums">${escapeHtml(formatCurrency(breakdown.mealTotal))}</span>
      </div>
      <div class="budget-line">
        <span>${escapeHtml(store.t('budgetTicketsLine', { days: breakdown.days, people: breakdown.people }))}</span>
        <span class="tabular-nums">${escapeHtml(formatCurrency(breakdown.ticketsTotal))}</span>
      </div>
      <div class="budget-total">
        <span>${escapeHtml(store.t('budgetTotalLabel'))}</span>
        <strong class="tabular-nums">${escapeHtml(formatCurrency(breakdown.total))}</strong>
      </div>
      <div class="budget-line">
        <span>${escapeHtml(store.t('budgetPerPersonLabel'))}</span>
        <span class="tabular-nums">${escapeHtml(formatCurrency(breakdown.perPerson))}</span>
      </div>
    `;
  }

  // Interest options
  const interestEl = document.getElementById('interestFilter');
  if (interestEl) {
    const prev = interestEl.value || 'all';
    interestEl.innerHTML =
      `<option value="all">${escapeHtml(store.t('allInterests'))}</option>` +
      categories
        .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(getCategoryLabel(c, lang))}</option>`)
        .join('');
    interestEl.value = prev;
  }

  renderRecommendations();
  renderFavoritesPanel();
}
