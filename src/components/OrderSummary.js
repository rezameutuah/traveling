import { prepChecklistItems } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml, formatCurrency } from '../utils/format.js';
import { navigateToPage } from '../utils/router.js';
import { showToast } from '../utils/toast.js';
import { getCategoryLabel } from './Destinations.js';

function addDaysToIso(dateStr, nights) {
  if (!dateStr) return '';
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  dt.setDate(dt.getDate() + Math.max(1, Number(nights) || 1));
  return dt.toISOString().slice(0, 10);
}

function getActiveAccountLabel() {
  const { authUser, credUser, demoUser } = store.getState();
  if (authUser) {
    return `${authUser.displayName || authUser.email} (${authUser.email || 'Google'})`;
  }
  if (credUser) {
    return `${credUser.displayName || credUser.username} (@${credUser.username})`;
  }
  if (demoUser) {
    return `${demoUser.displayName} (${demoUser.email})`;
  }
  return store.t('summaryGuestLabel');
}

function buildCompleteSummaryPlainText() {
  const state = store.getState();
  const { lang } = state;
  const summary = store.getAllOrdersSummary();

  const lines = [
    '==========================================',
    'DISCOVER ACEH — RINGKASAN PESANAN & PILIHAN',
    '==========================================',
    `${store.t('summaryAccountHeading')}: ${getActiveAccountLabel()}`,
    '',
    '1. RINCIAN TOTAL PER HALAMAN:',
    `- ${store.t('navDest')}: ${formatCurrency(summary.destinationSubtotal)} (${summary.counts.destinations} aktif)`,
    `- ${store.t('navFood')}: ${formatCurrency(summary.foodSubtotal)} (${summary.counts.foods} aktif)`,
    `- ${store.t('navStay')}: ${formatCurrency(summary.staySubtotal)} (${summary.counts.stays} aktif)`,
    `- ${store.t('navWaterboom')}: ${formatCurrency(summary.waterboomSubtotal)} (${summary.counts.waterbooms} aktif)`,
    `- ${store.t('navCar')}: ${formatCurrency(summary.travelSubtotal)} (${summary.counts.travelCars} aktif)`,
    `>> ${store.t('summaryGrandTotalLabel')}: ${formatCurrency(summary.grandTotal)}`,
    '',
    '2. DETAIL PEMESANAN AKTIF:',
  ];

  const appendServiceGroup = (title, items, formatter) => {
    const active = items.filter((i) => i.status !== 'cancelled');
    lines.push(`[${title}]`);
    if (!active.length) {
      lines.push(`  - ${store.t('summaryEmptySection')}`);
    } else {
      active.forEach((item) => lines.push(`  - ${formatter(item)}`));
    }
  };

  appendServiceGroup(
    store.t('navDest'),
    state.destinationBookings,
    (b) => `${b.bookingCode} | ${b.itemName} (${b.itemRegion}) | ${b.serviceDate} | ${b.quantity} tiket | ${b.contactName} (${b.contactPhone}) | ${formatCurrency(b.totalEstimate)}`
  );
  appendServiceGroup(
    store.t('navFood'),
    state.foodBookings,
    (b) => `${b.bookingCode} | ${b.itemName} (${b.itemRegion}) | ${b.serviceDate} | ${b.quantity} porsi | ${b.contactName} (${b.contactPhone}) | ${formatCurrency(b.totalEstimate)}`
  );
  appendServiceGroup(
    store.t('navStay'),
    state.stayBookings,
    (b) => `${b.bookingCode} | ${b.stayName} (${b.roomType}) | ${b.checkInDate} (${b.nights} malam, ${b.rooms} kamar, ${b.guests} tamu) | ${b.contactName} (${b.contactPhone}) | ${formatCurrency(b.totalEstimate)}`
  );
  appendServiceGroup(
    store.t('navWaterboom'),
    state.waterboomBookings,
    (b) => `${b.bookingCode} | ${b.itemName} (${b.itemRegion}) | ${b.serviceDate} | ${b.quantity} tiket | ${b.contactName} (${b.contactPhone}) | ${formatCurrency(b.totalEstimate)}`
  );
  appendServiceGroup(
    store.t('navCar'),
    state.travelBookings,
    (b) => `${b.bookingCode} | ${b.vehicleName} | ${b.pickupLocation} -> ${b.destinationRegion} | ${b.pickupDate} (${b.days} hari, ${b.passengers} penumpang) | ${b.contactName} (${b.contactPhone}) | ${formatCurrency(b.totalEstimate)}`
  );

  lines.push('', '3. RENCANA ITINERARY & FAVORIT:');
  lines.push(
    `Trip: ${state.tripMeta.name} (${state.tripMeta.date || '-'}, ${state.tripMeta.days} hari, ${state.tripMeta.travellers} orang)`
  );
  if (state.activities.length) {
    state.activities.forEach((a) => {
      const dest = state.destinations.find((d) => d.id === a.destinationId);
      lines.push(`  - ${store.t('dayLabel')} ${a.day}: ${dest ? `${dest.name} (${dest.region})` : a.destinationId}`);
    });
  } else {
    lines.push(`  - ${store.t('emptyActivities')}`);
  }

  const favNames = state.favorites
    .map((id) => state.destinations.find((d) => d.id === id)?.name)
    .filter(Boolean);
  lines.push(`Favorit (${favNames.length}): ${favNames.length ? favNames.join(', ') : '-'}`);

  const doneCount = prepChecklistItems.filter((item) => Boolean(state.prepChecklist[item.key])).length;
  lines.push(`Checklist: ${doneCount} / ${prepChecklistItems.length}`);
  prepChecklistItems.forEach((item) => {
    const mark = state.prepChecklist[item.key] ? '[x]' : '[ ]';
    lines.push(`  ${mark} ${lang === 'en' ? item.en : item.id}`);
  });

  return lines.join('\n');
}

function printCompleteSummarySheet() {
  const state = store.getState();
  const summary = store.getAllOrdersSummary();
  const sheet = document.getElementById('printSheet');
  if (!sheet) return;

  const renderPrintRows = (title, items, fmt) => {
    const active = items.filter((b) => b.status !== 'cancelled');
    return `
      <h3 style="margin:14px 0 6px;">${escapeHtml(title)}</h3>
      ${
        active.length
          ? `<ul>${active.map((b) => `<li>${escapeHtml(fmt(b))}</li>`).join('')}</ul>`
          : `<p style="color:#666;font-size:13px;">${escapeHtml(store.t('summaryEmptySection'))}</p>`
      }
    `;
  };

  sheet.innerHTML = `
    <h1 style="margin-bottom:4px;">Discover Aceh — ${escapeHtml(store.t('summaryTitle'))}</h1>
    <p style="margin-bottom:14px;color:#444;">${escapeHtml(getActiveAccountLabel())}</p>

    <div style="padding:12px 16px;border:1px solid #075b46;border-radius:8px;margin-bottom:16px;">
      <strong>${escapeHtml(store.t('summaryGrandTotalLabel'))}:</strong>
      <span style="font-size:18px;font-weight:700;margin-left:8px;">${escapeHtml(
        formatCurrency(summary.grandTotal)
      )}</span>
      <span style="color:#555;margin-left:8px;">(${summary.totalActiveCount} ${escapeHtml(
    store.t('summaryActiveOrdersSuffix')
  )})</span>
    </div>

    <h2>${escapeHtml(store.t('summaryBreakdownTitle'))}</h2>
    <ul>
      <li>${escapeHtml(store.t('navDest'))}: <strong>${escapeHtml(formatCurrency(summary.destinationSubtotal))}</strong> (${summary.counts.destinations})</li>
      <li>${escapeHtml(store.t('navFood'))}: <strong>${escapeHtml(formatCurrency(summary.foodSubtotal))}</strong> (${summary.counts.foods})</li>
      <li>${escapeHtml(store.t('navStay'))}: <strong>${escapeHtml(formatCurrency(summary.staySubtotal))}</strong> (${summary.counts.stays})</li>
      <li>${escapeHtml(store.t('navWaterboom'))}: <strong>${escapeHtml(formatCurrency(summary.waterboomSubtotal))}</strong> (${summary.counts.waterbooms})</li>
      <li>${escapeHtml(store.t('navCar'))}: <strong>${escapeHtml(formatCurrency(summary.travelSubtotal))}</strong> (${summary.counts.travelCars})</li>
    </ul>

    <h2 style="margin-top:18px;">${escapeHtml(store.t('summaryOrdersHeading'))}</h2>
    ${renderPrintRows(
      store.t('navDest'),
      state.destinationBookings,
      (b) => `${b.bookingCode} · ${b.itemName} (${b.serviceDate}, ${b.quantity} tiket) — ${formatCurrency(b.totalEstimate)} [${b.contactName} / ${b.contactPhone}]`
    )}
    ${renderPrintRows(
      store.t('navFood'),
      state.foodBookings,
      (b) => `${b.bookingCode} · ${b.itemName} (${b.serviceDate}, ${b.quantity} porsi) — ${formatCurrency(b.totalEstimate)} [${b.contactName} / ${b.contactPhone}]`
    )}
    ${renderPrintRows(
      store.t('navStay'),
      state.stayBookings,
      (b) => `${b.bookingCode} · ${b.stayName} (${b.roomType}, ${b.checkInDate}, ${b.nights} malam, ${b.rooms} kamar) — ${formatCurrency(b.totalEstimate)} [${b.contactName} / ${b.contactPhone}]`
    )}
    ${renderPrintRows(
      store.t('navWaterboom'),
      state.waterboomBookings,
      (b) => `${b.bookingCode} · ${b.itemName} (${b.serviceDate}, ${b.quantity} tiket) — ${formatCurrency(b.totalEstimate)} [${b.contactName} / ${b.contactPhone}]`
    )}
    ${renderPrintRows(
      store.t('navCar'),
      state.travelBookings,
      (b) => `${b.bookingCode} · ${b.vehicleName} (${b.pickupLocation} → ${b.destinationRegion}, ${b.pickupDate}, ${b.days} hari) — ${formatCurrency(b.totalEstimate)} [${b.contactName} / ${b.contactPhone}]`
    )}

    <h2 style="margin-top:18px;">${escapeHtml(store.t('summaryTripHeading'))}</h2>
    <p>${escapeHtml(state.tripMeta.name)} · ${escapeHtml(state.tripMeta.date || '-')} · ${state.tripMeta.days} ${escapeHtml(
    store.t('dayLabel')
  )} · ${state.tripMeta.travellers} ${escapeHtml(store.t('lblTravellers'))}</p>
    <ul>
      ${
        state.activities.length
          ? state.activities
              .map((a) => {
                const dest = state.destinations.find((d) => d.id === a.destinationId);
                return `<li>${escapeHtml(store.t('dayLabel'))} ${a.day} — ${escapeHtml(
                  dest ? `${dest.name} (${dest.region})` : a.destinationId
                )}</li>`;
              })
              .join('')
          : `<li>${escapeHtml(store.t('emptyActivities'))}</li>`
      }
    </ul>
  `;
  window.print();
}

function syncAllTotalsToTripBudget() {
  const state = store.getState();
  const summary = store.getAllOrdersSummary();
  const activeStays = state.stayBookings.filter((b) => b.status !== 'cancelled');
  const totalNights = activeStays.reduce((acc, b) => acc + Math.max(1, Number(b.nights) || 1), 0);
  const avgNightlyHotel =
    totalNights > 0 ? Math.round(summary.staySubtotal / totalNights) : state.budget.hotel;

  const days = Math.max(1, Number(state.tripMeta.days) || 1);
  const people = Math.max(1, Number(state.tripMeta.travellers) || 1);
  const combinedTicketBookings = summary.destinationSubtotal + summary.waterboomSubtotal;

  store.setBudget({
    transport: summary.travelSubtotal > 0 ? summary.travelSubtotal : state.budget.transport,
    hotel: summary.staySubtotal > 0 ? avgNightlyHotel : state.budget.hotel,
    tickets:
      combinedTicketBookings > 0
        ? Math.round(combinedTicketBookings / (days * people))
        : state.budget.tickets,
    meal:
      summary.foodSubtotal > 0
        ? Math.round(summary.foodSubtotal / (days * people))
        : state.budget.meal,
  });

  showToast(store.t('toastAllBudgetSynced'));
  navigateToPage('planner');
}

function renderSummaryNavBadges() {
  const summary = store.getAllOrdersSummary();
  document.querySelectorAll('[data-nav-page="summary"]').forEach((el) => {
    const isNavLink = el.closest('.nav-links, .mobile-drawer-inner, .footer-links-col');
    if (!isNavLink) return;
    const baseText = store.t('navSummary');
    el.textContent =
      summary.totalActiveCount > 0 ? `${baseText} (${summary.totalActiveCount})` : baseText;
  });
}

export function renderOrderSummarySection() {
  renderSummaryNavBadges();

  const bannerHost = document.getElementById('summaryGrandBanner');
  const breakdownHost = document.getElementById('summaryBreakdownGrid');
  const ordersHost = document.getElementById('summaryOrdersContainer');
  const selectionsHost = document.getElementById('summarySelectionsGrid');
  if (!bannerHost || !breakdownHost || !ordersHost || !selectionsHost) return;

  const state = store.getState();
  const { lang } = state;
  const summary = store.getAllOrdersSummary();

  // 1. Grand Total Banner
  bannerHost.innerHTML = `
    <div class="summary-grand-main">
      <p class="summary-grand-label">${escapeHtml(store.t('summaryGrandTotalLabel'))}</p>
      <div class="summary-grand-amount tabular-nums">${escapeHtml(
        formatCurrency(summary.grandTotal)
      )}</div>
      <p class="summary-grand-meta tabular-nums">
        ${summary.totalActiveCount} ${escapeHtml(store.t('summaryActiveOrdersSuffix'))}
      </p>
    </div>
    <div class="summary-grand-actions">
      <button type="button" class="btn btn-gold" id="summarySyncBudgetBtn">
        ${escapeHtml(store.t('summarySyncBudgetBtn'))}
      </button>
      <button type="button" class="btn btn-light" id="summaryCopyAllBtn">
        ${escapeHtml(store.t('summaryCopyAllBtn'))}
      </button>
      <button type="button" class="btn btn-outline-light" id="summaryPrintAllBtn">
        ${escapeHtml(store.t('summaryPrintAllBtn'))}
      </button>
    </div>
  `;

  document.getElementById('summarySyncBudgetBtn')?.addEventListener('click', syncAllTotalsToTripBudget);
  document.getElementById('summaryCopyAllBtn')?.addEventListener('click', async () => {
    const text = buildCompleteSummaryPlainText();
    try {
      await navigator.clipboard.writeText(text);
      showToast(store.t('toastAllSummaryCopied'));
    } catch {
      printCompleteSummarySheet();
    }
  });
  document.getElementById('summaryPrintAllBtn')?.addEventListener('click', printCompleteSummarySheet);

  // 2. Per-Page Breakdown Cards
  const pageGroups = [
    {
      key: 'destinations',
      page: 'destinations',
      index: '01',
      title: store.t('navDest'),
      subtotal: summary.destinationSubtotal,
      activeCount: summary.counts.destinations,
      items: state.destinationBookings,
    },
    {
      key: 'foods',
      page: 'culinary',
      index: '02',
      title: store.t('navFood'),
      subtotal: summary.foodSubtotal,
      activeCount: summary.counts.foods,
      items: state.foodBookings,
    },
    {
      key: 'stays',
      page: 'stay',
      index: '03',
      title: store.t('navStay'),
      subtotal: summary.staySubtotal,
      activeCount: summary.counts.stays,
      items: state.stayBookings,
    },
    {
      key: 'waterbooms',
      page: 'waterboom',
      index: '04',
      title: store.t('navWaterboom'),
      subtotal: summary.waterboomSubtotal,
      activeCount: summary.counts.waterbooms,
      items: state.waterboomBookings,
    },
    {
      key: 'travelCars',
      page: 'travel-car',
      index: '05',
      title: store.t('navCar'),
      subtotal: summary.travelSubtotal,
      activeCount: summary.counts.travelCars,
      items: state.travelBookings,
    },
  ];

  breakdownHost.innerHTML = pageGroups
    .map(
      (grp) => `
      <article class="summary-breakdown-card ${grp.activeCount > 0 ? 'has-items' : ''}">
        <div class="summary-breakdown-top">
          <span class="portal-index tabular-nums">${escapeHtml(grp.index)}</span>
          <span class="summary-count-tag tabular-nums">${grp.activeCount} ${escapeHtml(
        lang === 'en' ? 'active' : 'aktif'
      )}</span>
        </div>
        <h4>${escapeHtml(grp.title)}</h4>
        <strong class="summary-subtotal-price tabular-nums">${escapeHtml(
          formatCurrency(grp.subtotal)
        )}</strong>
        <a href="#" class="summary-manage-link" data-nav-page="${escapeHtml(grp.page)}">
          ${escapeHtml(store.t('summaryEditPageBtn'))} →
        </a>
      </article>
    `
    )
    .join('');

  // 3. Detailed Orders Grouped by Page
  ordersHost.innerHTML = pageGroups
    .map((grp) => {
      const rowsHtml = !grp.items.length
        ? `<p class="muted-empty">${escapeHtml(store.t('summaryEmptySection'))}</p>`
        : grp.items
            .map((bk) => {
              const isCancelled = bk.status === 'cancelled';
              let itemTitle = '';
              let metaLine = '';
              let detailLine = '';
              let actionType = '';

              if (grp.key === 'destinations') {
                actionType = 'dest';
                itemTitle = bk.itemName;
                metaLine = bk.itemRegion;
                detailLine = `${bk.serviceDate} · ${bk.quantity} ${
                  lang === 'en' ? 'ticket(s)' : 'tiket'
                } · ${bk.contactName} (${bk.contactPhone})`;
              } else if (grp.key === 'foods') {
                actionType = 'food';
                itemTitle = bk.itemName;
                metaLine = bk.itemRegion;
                detailLine = `${bk.serviceDate} · ${bk.quantity} ${
                  lang === 'en' ? 'portion(s)' : 'porsi/paket'
                } · ${bk.contactName} (${bk.contactPhone})`;
              } else if (grp.key === 'stays') {
                actionType = 'stay';
                itemTitle = bk.stayName;
                metaLine = `${bk.stayRegion} · ${bk.roomType}`;
                detailLine = `${bk.checkInDate} → ${addDaysToIso(bk.checkInDate, bk.nights)} · ${
                  bk.nights
                } ${lang === 'en' ? 'night(s)' : 'malam'} · ${bk.rooms} ${
                  lang === 'en' ? 'room(s)' : 'kamar'
                } · ${bk.guests} ${lang === 'en' ? 'guest(s)' : 'tamu'} · ${bk.contactName} (${
                  bk.contactPhone
                })`;
              } else if (grp.key === 'waterbooms') {
                actionType = 'wb';
                itemTitle = bk.itemName;
                metaLine = bk.itemRegion;
                detailLine = `${bk.serviceDate} · ${bk.quantity} ${
                  lang === 'en' ? 'ticket(s)' : 'tiket'
                } · ${bk.contactName} (${bk.contactPhone})`;
              } else {
                actionType = 'car';
                const serviceLabel =
                  bk.serviceType === 'driver_only'
                    ? store.t('carServiceDriverOnly')
                    : store.t('carServiceDriverFuel');
                itemTitle = bk.vehicleName;
                metaLine = `${bk.pickupLocation} → ${bk.destinationRegion}`;
                detailLine = `${bk.pickupDate} · ${bk.days} ${
                  lang === 'en' ? 'day(s)' : 'hari'
                } · ${bk.passengers} ${
                  lang === 'en' ? 'pax' : 'penumpang'
                } · ${serviceLabel} · ${bk.contactName} (${bk.contactPhone})`;
              }

              const priceText =
                Number(bk.totalEstimate) === 0 && grp.key === 'destinations'
                  ? store.t('freeEntry')
                  : formatCurrency(bk.totalEstimate);

              return `
                <div class="booking-row ${isCancelled ? 'is-cancelled' : ''}">
                  <div class="booking-row-head">
                    <div>
                      <span class="booking-code tabular-nums">${escapeHtml(bk.bookingCode)}</span>
                      <h4>${escapeHtml(itemTitle)}</h4>
                    </div>
                    <span class="booking-status ${isCancelled ? 'is-cancelled' : 'is-pending'}">
                      ${escapeHtml(
                        isCancelled ? store.t('carStatusCancelled') : store.t('destStatusPending')
                      )}
                    </span>
                  </div>
                  <p class="card-meta">${escapeHtml(metaLine)}</p>
                  <p class="booking-specs tabular-nums">${escapeHtml(detailLine)}</p>
                  ${bk.notes ? `<p class="booking-notes">${escapeHtml(bk.notes)}</p>` : ''}
                  <div class="booking-row-foot">
                    <strong class="price-text tabular-nums">${escapeHtml(priceText)}</strong>
                    <div class="list-row-actions">
                      ${
                        !isCancelled
                          ? `<button
                              type="button"
                              class="btn btn-outline btn-sm"
                              data-sum-cancel="${escapeHtml(actionType)}"
                              data-sum-id="${escapeHtml(bk.id)}"
                            >
                              ${escapeHtml(store.t('carCancelBtn'))}
                            </button>`
                          : ''
                      }
                      <button
                        type="button"
                        class="btn btn-danger-outline btn-sm"
                        data-sum-delete="${escapeHtml(actionType)}"
                        data-sum-id="${escapeHtml(bk.id)}"
                      >
                        ${escapeHtml(store.t('carDeleteBtn'))}
                      </button>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('');

      return `
        <article class="panel summary-group-panel">
          <div class="summary-group-head">
            <div>
              <p class="panel-index tabular-nums">${escapeHtml(grp.index)}. ${escapeHtml(grp.title)}</p>
              <h4>${escapeHtml(grp.title)}</h4>
            </div>
            <div class="summary-group-total">
              <strong class="price-text tabular-nums">${escapeHtml(
                formatCurrency(grp.subtotal)
              )}</strong>
              <a href="#" class="btn btn-light btn-sm" data-nav-page="${escapeHtml(grp.page)}">
                + ${escapeHtml(store.t('btnAdd'))}
              </a>
            </div>
          </div>
          <div class="car-bookings-list">${rowsHtml}</div>
        </article>
      `;
    })
    .join('');

  ordersHost.querySelectorAll('button[data-sum-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-sum-cancel');
      const id = btn.getAttribute('data-sum-id');
      if (!id) return;
      if (kind === 'dest') store.cancelDestinationBooking(id);
      else if (kind === 'food') store.cancelFoodBooking(id);
      else if (kind === 'stay') store.cancelStayBooking(id);
      else if (kind === 'wb') store.cancelWaterboomBooking(id);
      else if (kind === 'car') store.cancelTravelBooking(id);
    });
  });

  ordersHost.querySelectorAll('button[data-sum-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-sum-delete');
      const id = btn.getAttribute('data-sum-id');
      if (!id) return;
      if (kind === 'dest') store.deleteDestinationBooking(id);
      else if (kind === 'food') store.deleteFoodBooking(id);
      else if (kind === 'stay') store.deleteStayBooking(id);
      else if (kind === 'wb') store.deleteWaterboomBooking(id);
      else if (kind === 'car') store.deleteTravelBooking(id);
    });
  });

  // 4. All Selected Trip, Favorites, Checklist & Contact Data
  const sortedActivities = [...state.activities].sort((a, b) => a.day - b.day);
  const favDestinations = state.favorites
    .map((fid) => state.destinations.find((d) => d.id === fid))
    .filter(Boolean);
  const doneChecklist = prepChecklistItems.filter((item) => Boolean(state.prepChecklist[item.key])).length;

  const allContacts = [];
  const collectContact = (list, nameKey = 'contactName', phoneKey = 'contactPhone') => {
    list.forEach((b) => {
      if (b[nameKey] && b[phoneKey]) {
        const label = `${b[nameKey]} · ${b[phoneKey]}`;
        if (!allContacts.includes(label)) allContacts.push(label);
      }
    });
  };
  collectContact(state.destinationBookings);
  collectContact(state.foodBookings);
  collectContact(state.stayBookings);
  collectContact(state.waterboomBookings);
  collectContact(state.travelBookings);

  selectionsHost.innerHTML = `
    <article class="panel">
      <div class="panel-header">
        <p class="panel-index">${escapeHtml(store.t('summaryTripHeading'))}</p>
        <h3>${escapeHtml(state.tripMeta.name || 'Jelajah Aceh')}</h3>
        <p class="panel-desc tabular-nums">
          ${escapeHtml(store.t('lblTripDate'))}: ${escapeHtml(state.tripMeta.date || '-')} ·
          ${state.tripMeta.days} ${escapeHtml(store.t('dayLabel'))} ·
          ${state.tripMeta.travellers} ${escapeHtml(store.t('lblTravellers'))}
        </p>
      </div>
      <div class="activity-list">
        ${
          sortedActivities.length
            ? sortedActivities
                .map((act) => {
                  const dest = state.destinations.find((d) => d.id === act.destinationId);
                  return `
                    <div class="list-row">
                      <div class="list-row-main">
                        <span class="list-row-title">${escapeHtml(dest?.name || 'Destinasi')}</span>
                        <span class="list-row-sub">${escapeHtml(store.t('dayLabel'))} ${act.day} · ${escapeHtml(
                    dest?.region || ''
                  )}</span>
                      </div>
                      <span class="card-price tabular-nums">${escapeHtml(
                        dest?.cost ? formatCurrency(dest.cost) : store.t('freeEntry')
                      )}</span>
                    </div>
                  `;
                })
                .join('')
            : `<p class="list-row-sub">${escapeHtml(store.t('emptyActivities'))}</p>`
        }
      </div>
      <div class="panel-actions">
        <a href="/rencana-trip" class="btn btn-light btn-sm" data-nav-page="planner">
          ${escapeHtml(store.t('navPlan'))} →
        </a>
      </div>
    </article>

    <article class="panel">
      <div class="panel-header">
        <p class="panel-index">${escapeHtml(store.t('summaryFavHeading'))}</p>
        <h3>${favDestinations.length} ${escapeHtml(store.t('navDest'))}</h3>
      </div>
      <div class="favorites-list">
        ${
          favDestinations.length
            ? favDestinations
                .map(
                  (d) => `
                  <div class="list-row">
                    <div class="list-row-main">
                      <span class="list-row-title">${escapeHtml(d.name)}</span>
                      <span class="list-row-sub">${escapeHtml(getCategoryLabel(d.category, lang))} · ${escapeHtml(
                    d.region
                  )}</span>
                    </div>
                    <span class="card-price tabular-nums">${escapeHtml(
                      d.cost ? formatCurrency(d.cost) : store.t('freeEntry')
                    )}</span>
                  </div>
                `
                )
                .join('')
            : `<p class="list-row-sub">${escapeHtml(store.t('emptyFavorites'))}</p>`
        }
      </div>
      <div class="panel-actions">
        <a href="/destinasi" class="btn btn-light btn-sm" data-nav-page="destinations">
          ${escapeHtml(store.t('navDest'))} →
        </a>
      </div>
    </article>

    <article class="panel">
      <div class="panel-header">
        <p class="panel-index">${escapeHtml(store.t('summaryChecklistHeading'))}</p>
        <h3 class="tabular-nums">${doneChecklist} / ${prepChecklistItems.length}</h3>
      </div>
      <div class="activity-list">
        ${prepChecklistItems
          .map((item) => {
            const checked = Boolean(state.prepChecklist[item.key]);
            return `
              <div class="list-row">
                <div class="list-row-main">
                  <span class="list-row-title">${checked ? '✓' : '○'} ${escapeHtml(
              lang === 'en' ? item.en : item.id
            )}</span>
                  <span class="list-row-sub">${escapeHtml(
                    checked ? store.t('summaryDoneLabel') : store.t('summaryPendingCheckLabel')
                  )}</span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
      <div class="panel-actions">
        <a href="/checklist" class="btn btn-light btn-sm" data-nav-page="checklist">
          ${escapeHtml(store.t('navChecklist'))} →
        </a>
      </div>
    </article>

    <article class="panel">
      <div class="panel-header">
        <p class="panel-index">${escapeHtml(store.t('summaryAccountHeading'))}</p>
        <h3>${escapeHtml(getActiveAccountLabel())}</h3>
      </div>
      <div class="activity-list">
        ${
          allContacts.length
            ? allContacts
                .map(
                  (c) => `
                  <div class="list-row">
                    <span class="list-row-title tabular-nums">${escapeHtml(c)}</span>
                  </div>
                `
                )
                .join('')
            : `<p class="list-row-sub">${escapeHtml(store.t('summaryEmptySection'))}</p>`
        }
      </div>
      <div class="panel-actions">
        <a href="/masuk" class="btn btn-light btn-sm" data-nav-page="login">
          ${escapeHtml(store.t('navLoginBtn'))} →
        </a>
      </div>
    </article>
  `;
}
