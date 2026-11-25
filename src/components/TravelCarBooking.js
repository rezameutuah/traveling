import { regions, travelPickupPoints } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml, formatCurrency, sanitizeUrl } from '../utils/format.js';
import { navigateToPage } from '../utils/router.js';
import { showToast } from '../utils/toast.js';
import { attachImageFallback } from './ExploreAndGallery.js';

const carDraft = {
  vehicleId: 'car-innova',
  pickupLocation: travelPickupPoints[0],
  destinationRegion: regions[0].name,
  pickupDate: new Date().toISOString().slice(0, 10),
  days: 2,
  passengers: 3,
  serviceType: 'driver_fuel',
  contactName: '',
  contactPhone: '',
  notes: '',
};

function getSelectedVehicle() {
  const { travelCars } = store.getState();
  return travelCars.find((c) => c.id === carDraft.vehicleId) || travelCars[0];
}

function calculateBookingEstimate(vehicle, days, serviceType) {
  if (!vehicle) return { baseCost: 0, fuelCost: 0, total: 0 };
  const safeDays = Math.min(7, Math.max(1, Math.trunc(Number(days) || 1)));
  const baseCost = vehicle.dailyRate * safeDays;
  const fuelCost = serviceType === 'driver_fuel' ? vehicle.fuelRatePerDay * safeDays : 0;
  return {
    baseCost,
    fuelCost,
    total: baseCost + fuelCost,
  };
}

function renderFleetCards() {
  const host = document.getElementById('carCardsGrid');
  if (!host) return;
  const { lang, travelCars } = store.getState();

  host.innerHTML = travelCars
    .map((car) => {
      const isSelected = car.id === carDraft.vehicleId;
      const typeLabel = lang === 'en' ? car.typeEn : car.typeId;
      const baggageLabel = lang === 'en' ? car.baggageEn : car.baggage;
      const highlights = lang === 'en' ? car.highlightsEn : car.highlightsId;
      const photoUrl = sanitizeUrl(car.photo);

      return `
        <article class="catalog-card car-fleet-card ${isSelected ? 'is-selected' : ''}">
          <div class="car-card-media">
            ${
              photoUrl
                ? `<img
                    src="${escapeHtml(photoUrl)}"
                    alt="${escapeHtml(car.name)} — ${escapeHtml(typeLabel)}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    data-fallback-title="${escapeHtml(car.name)}"
                  />`
                : `<div class="img-fallback"><span>${escapeHtml(car.name)}</span></div>`
            }
          </div>

          <div class="car-card-body">
            <div class="catalog-head">
              <div>
                <h3>${escapeHtml(car.name)}</h3>
                <p class="car-type-sub">${escapeHtml(typeLabel)}</p>
              </div>
              <span class="price-text tabular-nums">${escapeHtml(formatCurrency(car.dailyRate))}${escapeHtml(
                store.t('carPerDay')
              )}</span>
            </div>

            <p class="card-meta">
              <span>${car.seats} ${escapeHtml(store.t('carCapacitySuffix'))}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(baggageLabel)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(car.regions.join(', '))}</span>
            </p>

            <p class="card-desc">${escapeHtml(highlights)}</p>

            <div class="card-actions">
              <button
                type="button"
                class="btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm"
                data-select-car="${escapeHtml(car.id)}"
              >
                ${escapeHtml(isSelected ? store.t('carSelectedBtn') : store.t('carSelectBtn'))}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  attachImageFallback(host);

  host.querySelectorAll('button[data-select-car]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const carId = btn.getAttribute('data-select-car');
      if (!carId) return;
      carDraft.vehicleId = carId;
      const vehicle = getSelectedVehicle();
      if (vehicle && carDraft.passengers > vehicle.seats) {
        carDraft.passengers = vehicle.seats;
      }
      renderTravelCarSection();
      document.getElementById('travelCarForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

function renderEstimateSummary() {
  const box = document.getElementById('carEstimateBox');
  if (!box) return;
  const vehicle = getSelectedVehicle();
  const est = calculateBookingEstimate(vehicle, carDraft.days, carDraft.serviceType);

  box.innerHTML = `
    <div class="budget-line">
      <span>${escapeHtml(store.t('carRateBaseLine', { days: carDraft.days }))}</span>
      <span class="tabular-nums">${escapeHtml(formatCurrency(est.baseCost))}</span>
    </div>
    ${
      carDraft.serviceType === 'driver_fuel'
        ? `<div class="budget-line">
            <span>${escapeHtml(store.t('carRateFuelLine', { days: carDraft.days }))}</span>
            <span class="tabular-nums">${escapeHtml(formatCurrency(est.fuelCost))}</span>
          </div>`
        : ''
    }
    <div class="budget-total">
      <span>${escapeHtml(store.t('carRateTotalLine'))}</span>
      <strong class="tabular-nums">${escapeHtml(formatCurrency(est.total))}</strong>
    </div>
  `;
}

function syncFormControls() {
  const { travelCars, authUser, credUser, demoUser } = store.getState();

  const activeName =
    authUser?.displayName || credUser?.displayName || demoUser?.displayName || '';
  if (!carDraft.contactName && activeName) {
    carDraft.contactName = activeName;
  }

  const carSelect = document.getElementById('carSelect');
  if (carSelect) {
    carSelect.innerHTML = travelCars
      .map(
        (car) =>
          `<option value="${escapeHtml(car.id)}">${escapeHtml(car.name)} (${car.seats} ${escapeHtml(
            store.t('carCapacitySuffix')
          )} · ${escapeHtml(formatCurrency(car.dailyRate))})</option>`
      )
      .join('');
    carSelect.value = carDraft.vehicleId;
  }

  const pickupSelect = document.getElementById('carPickupSelect');
  if (pickupSelect) {
    pickupSelect.innerHTML = travelPickupPoints
      .map((pt) => `<option value="${escapeHtml(pt)}">${escapeHtml(pt)}</option>`)
      .join('');
    pickupSelect.value = carDraft.pickupLocation;
  }

  const destSelect = document.getElementById('carDestSelect');
  if (destSelect) {
    destSelect.innerHTML = regions
      .map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`)
      .join('');
    destSelect.value = carDraft.destinationRegion;
  }

  const dateEl = document.getElementById('carDateInput');
  if (dateEl && dateEl !== document.activeElement) dateEl.value = carDraft.pickupDate;

  const daysEl = document.getElementById('carDaysSelect');
  if (daysEl && daysEl !== document.activeElement) daysEl.value = String(carDraft.days);

  const paxEl = document.getElementById('carPassengersInput');
  const vehicle = getSelectedVehicle();
  if (paxEl) {
    paxEl.max = String(vehicle?.seats || 12);
    if (paxEl !== document.activeElement) paxEl.value = String(carDraft.passengers);
  }

  const serviceEl = document.getElementById('carServiceSelect');
  if (serviceEl && serviceEl !== document.activeElement) serviceEl.value = carDraft.serviceType;

  const nameEl = document.getElementById('carNameInput');
  if (nameEl && nameEl !== document.activeElement) nameEl.value = carDraft.contactName;

  const phoneEl = document.getElementById('carPhoneInput');
  if (phoneEl && phoneEl !== document.activeElement) phoneEl.value = carDraft.contactPhone;

  const notesEl = document.getElementById('carNotesInput');
  if (notesEl && notesEl !== document.activeElement) notesEl.value = carDraft.notes;
}

function renderBookingsList() {
  const host = document.getElementById('carBookingsList');
  if (!host) return;
  const { travelBookings, lang, travelCars } = store.getState();

  if (!travelBookings.length) {
    host.innerHTML = `<p class="muted-empty">${escapeHtml(store.t('carListEmpty'))}</p>`;
    return;
  }

  host.innerHTML = travelBookings
    .map((bk) => {
      const isCancelled = bk.status === 'cancelled';
      const statusLabel = isCancelled ? store.t('carStatusCancelled') : store.t('carStatusPending');
      const serviceLabel =
        bk.serviceType === 'driver_only'
          ? store.t('carServiceDriverOnly')
          : store.t('carServiceDriverFuel');
      const car = travelCars.find((c) => c.id === bk.vehicleId);
      const waContact = String(bk.vehicleContact || car?.contact || '6281234567011').replace(
        /[^0-9]/g,
        ''
      );
      const waMessage =
        lang === 'en'
          ? `Hello, I would like to confirm travel car booking ${bk.bookingCode} (${bk.vehicleName}) from ${bk.pickupLocation} to ${bk.destinationRegion} on ${bk.pickupDate} for ${bk.days} day(s), ${bk.passengers} passenger(s). Name: ${bk.contactName}.`
          : `Halo operator Discover Aceh, saya ingin konfirmasi pemesanan mobil travel ${bk.bookingCode} (${bk.vehicleName}) dari ${bk.pickupLocation} ke ${bk.destinationRegion} tanggal ${bk.pickupDate} (${bk.days} hari, ${bk.passengers} penumpang). Pemesan: ${bk.contactName}.`;

      return `
        <div class="booking-row ${isCancelled ? 'is-cancelled' : ''}">
          <div class="booking-row-head">
            <div>
              <span class="booking-code tabular-nums">${escapeHtml(bk.bookingCode)}</span>
              <h4>${escapeHtml(bk.vehicleName)}</h4>
            </div>
            <span class="booking-status ${isCancelled ? 'is-cancelled' : 'is-pending'}">
              ${escapeHtml(statusLabel)}
            </span>
          </div>

          <p class="card-meta">
            <span>${escapeHtml(bk.pickupLocation)} → ${escapeHtml(bk.destinationRegion)}</span>
          </p>

          <p class="booking-specs tabular-nums">
            ${escapeHtml(bk.pickupDate)} · ${bk.days} ${escapeHtml(
        lang === 'en' ? 'day(s)' : 'hari'
      )} · ${bk.passengers} ${escapeHtml(lang === 'en' ? 'pax' : 'penumpang')} · ${escapeHtml(
        serviceLabel
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
                      data-sync-booking-budget="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carSyncBudgetBtn'))}
                    </button>
                    <a
                      class="btn btn-outline btn-sm"
                      href="https://wa.me/${encodeURIComponent(waContact)}?text=${encodeURIComponent(
                        waMessage
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHtml(store.t('carWhatsappBtn'))}
                    </a>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      data-cancel-booking="${escapeHtml(bk.id)}"
                    >
                      ${escapeHtml(store.t('carCancelBtn'))}
                    </button>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger-outline btn-sm"
                data-delete-booking="${escapeHtml(bk.id)}"
              >
                ${escapeHtml(store.t('carDeleteBtn'))}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  host.querySelectorAll('button[data-sync-booking-budget]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-sync-booking-budget');
      const bk = store.getState().travelBookings.find((x) => x.id === id);
      if (!bk) return;
      store.setBudget({ transport: Math.max(0, Number(bk.totalEstimate) || 0) });
      const transportInput = document.getElementById('transportInput');
      if (transportInput) transportInput.value = String(bk.totalEstimate);
      showToast(store.t('toastCarBudgetSynced'));
      navigateToPage('planner');
    });
  });

  host.querySelectorAll('button[data-cancel-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-booking');
      if (id) {
        store.cancelTravelBooking(id);
        showToast(store.t('toastCarCancelled'));
      }
    });
  });

  host.querySelectorAll('button[data-delete-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-booking');
      if (id) store.deleteTravelBooking(id);
    });
  });
}

export function initTravelCarControls() {
  document.getElementById('carSelect')?.addEventListener('change', (e) => {
    carDraft.vehicleId = e.target.value;
    const vehicle = getSelectedVehicle();
    if (vehicle && carDraft.passengers > vehicle.seats) {
      carDraft.passengers = vehicle.seats;
    }
    renderTravelCarSection();
  });

  document.getElementById('carPickupSelect')?.addEventListener('change', (e) => {
    carDraft.pickupLocation = e.target.value;
  });

  document.getElementById('carDestSelect')?.addEventListener('change', (e) => {
    carDraft.destinationRegion = e.target.value;
  });

  document.getElementById('carDateInput')?.addEventListener('change', (e) => {
    carDraft.pickupDate = e.target.value;
  });

  document.getElementById('carDaysSelect')?.addEventListener('change', (e) => {
    carDraft.days = Math.min(7, Math.max(1, Number(e.target.value) || 1));
    renderEstimateSummary();
  });

  document.getElementById('carPassengersInput')?.addEventListener('input', (e) => {
    const maxSeats = getSelectedVehicle()?.seats || 12;
    carDraft.passengers = Math.min(maxSeats, Math.max(1, Number(e.target.value) || 1));
  });

  document.getElementById('carServiceSelect')?.addEventListener('change', (e) => {
    carDraft.serviceType = e.target.value === 'driver_only' ? 'driver_only' : 'driver_fuel';
    renderEstimateSummary();
  });

  document.getElementById('carNameInput')?.addEventListener('input', (e) => {
    carDraft.contactName = e.target.value;
  });

  document.getElementById('carPhoneInput')?.addEventListener('input', (e) => {
    carDraft.contactPhone = e.target.value;
  });

  document.getElementById('carNotesInput')?.addEventListener('input', (e) => {
    carDraft.notes = e.target.value;
  });

  document.getElementById('travelCarForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const vehicle = getSelectedVehicle();
    if (!vehicle) return;

    const cleanName = carDraft.contactName.trim();
    const cleanPhone = carDraft.contactPhone.trim();
    const pax = Math.trunc(Number(carDraft.passengers) || 0);

    if (
      cleanName.length < 1 ||
      cleanPhone.length < 6 ||
      cleanPhone.length > 24 ||
      pax < 1 ||
      pax > vehicle.seats ||
      !carDraft.pickupDate
    ) {
      showToast(store.t('toastCarInvalidForm'));
      return;
    }

    const est = calculateBookingEstimate(vehicle, carDraft.days, carDraft.serviceType);
    const created = store.createTravelBooking({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleContact: vehicle.contact,
      pickupLocation: carDraft.pickupLocation,
      destinationRegion: carDraft.destinationRegion,
      pickupDate: carDraft.pickupDate,
      days: carDraft.days,
      passengers: pax,
      serviceType: carDraft.serviceType,
      contactName: cleanName,
      contactPhone: cleanPhone,
      notes: carDraft.notes.trim(),
      totalEstimate: est.total,
    });

    carDraft.notes = '';
    const notesEl = document.getElementById('carNotesInput');
    if (notesEl) notesEl.value = '';

    showToast(store.t('toastCarBooked', { code: created.bookingCode }));
  });
}

export function renderTravelCarSection() {
  renderFleetCards();
  syncFormControls();
  renderEstimateSummary();
  renderBookingsList();
}
