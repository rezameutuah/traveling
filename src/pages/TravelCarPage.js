export function createTravelCarPageMarkup() {
  return `
    <section class="section section-surface" id="travel-car" data-page="travel-car" hidden aria-labelledby="travelCarTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="carKicker">Armada & Transportasi Darat</p>
            <h2 id="travelCarTitle" data-i18n="carTitle">Pemesanan Mobil Travel Aceh</h2>
            <p class="section-sub" data-i18n="carSub">
              Pilih armada pribadi atau rombongan dengan sopir lokal berpengalaman, jadwal berhenti waktu salat, dan estimasi tarif transparan.
            </p>
          </div>
          <div class="section-head-actions">
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>

        <div class="car-fleet-grid" id="carCardsGrid"></div>

        <div class="car-workspace-grid">
          <article class="panel" aria-labelledby="carFormHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="carFormIdx">01. Formulir Pemesanan</p>
              <h3 id="carFormHeading" data-i18n="carFormTitle">Atur Rute & Jadwal Mobil Travel</h3>
            </div>

            <form id="travelCarForm" class="car-booking-form">
              <div class="form-field">
                <label for="carSelect" data-i18n="carVehicleLabel">Armada pilihan</label>
                <select id="carSelect" required></select>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="carPickupSelect" data-i18n="carPickupLabel">Lokasi penjemputan</label>
                  <select id="carPickupSelect" required></select>
                </div>
                <div class="form-field">
                  <label for="carDestSelect" data-i18n="carDestLabel">Wilayah tujuan utama</label>
                  <select id="carDestSelect" required></select>
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-field">
                  <label for="carDateInput" data-i18n="carDateLabel">Tanggal penjemputan</label>
                  <input type="date" id="carDateInput" required />
                </div>
                <div class="form-field">
                  <label for="carDaysSelect" data-i18n="carDaysLabel">Durasi sewa (hari)</label>
                  <select id="carDaysSelect">
                    <option value="1">1</option>
                    <option value="2" selected>2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                  </select>
                </div>
                <div class="form-field">
                  <label for="carPassengersInput" data-i18n="carPassengersLabel">Jumlah penumpang</label>
                  <input type="number" id="carPassengersInput" min="1" max="12" value="3" required />
                </div>
              </div>

              <div class="form-field">
                <label for="carServiceSelect" data-i18n="carServiceLabel">Paket layanan</label>
                <select id="carServiceSelect">
                  <option value="driver_fuel" data-i18n="carServiceDriverFuel">Sopir + BBM (All-in rute)</option>
                  <option value="driver_only" data-i18n="carServiceDriverOnly">Sopir saja (BBM menyesuaikan)</option>
                </select>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="carNameInput" data-i18n="carContactNameLabel">Nama pemesan</label>
                  <input type="text" id="carNameInput" maxlength="80" required />
                </div>
                <div class="form-field">
                  <label for="carPhoneInput" data-i18n="carContactPhoneLabel">Nomor WhatsApp / Telepon</label>
                  <input type="tel" id="carPhoneInput" minlength="6" maxlength="24" placeholder="0812..." required />
                </div>
              </div>

              <div class="form-field">
                <label for="carNotesInput" data-i18n="carNotesLabel">Catatan perjalanan (opsional)</label>
                <input
                  type="text"
                  id="carNotesInput"
                  maxlength="240"
                  data-i18n-placeholder="carNotesPlaceholder"
                  placeholder="Misal: Jemput Bandara SIM pukul 09.00, berhenti salat Zuhur di Masjid Raya."
                />
              </div>

              <div class="budget-summary" id="carEstimateBox" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary" data-i18n="carSubmitBtn">
                Buat Pemesanan Mobil Travel
              </button>
            </form>

            <p class="field-disclaimer" data-i18n="carDisclaimer">
              Tarif di atas adalah estimasi awal sewa kendaraan dan sopir. Konfirmasi akhir ketersediaan unit serta titik jemput dilakukan langsung dengan operator via WhatsApp.
            </p>
          </article>

          <article class="panel" aria-labelledby="carListHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="carListIdx">02. Pesanan Tersimpan</p>
              <h3 id="carListHeading" data-i18n="carListTitle">Daftar Pemesanan Mobil Travel</h3>
            </div>
            <div class="car-bookings-list" id="carBookingsList"></div>
            <div class="panel-actions">
              <a href="/ringkasan" class="btn btn-light btn-sm" data-nav-page="summary">
                <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}
