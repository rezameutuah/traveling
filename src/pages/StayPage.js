export function createStayPageMarkup() {
  return `
    <section class="section section-surface" id="stay" data-page="stay" hidden aria-labelledby="stayTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="stayKicker">Istirahat Nyaman</p>
            <h2 id="stayTitle" data-i18n="stayTitle">Akomodasi Ramah Muslim</h2>
            <p class="section-sub" data-i18n="staySub">
              Pilihan penginapan dengan informasi fasilitas ibadah, penunjuk kiblat, serta estimasi tarif per malam.
            </p>
          </div>
          <div class="section-head-actions">
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>
        <div class="catalog-grid" id="stayCards"></div>
        <p class="field-disclaimer" data-i18n="stayDisclaimer">
          Fasilitas ramah Muslim mengacu pada kelengkapan ibadah bagi tamu Muslim dan berbeda dari sertifikasi hotel syariah resmi. Konfirmasikan ketersediaan kamar dan tarif terkini sebelum pemesanan.
        </p>

        <div class="car-workspace-grid stay-workspace-grid">
          <article class="panel" aria-labelledby="stayFormHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="stayFormIdx">01. Formulir Pemesanan</p>
              <h3 id="stayFormHeading" data-i18n="stayFormTitle">Atur Jadwal Menginap Ramah Muslim</h3>
            </div>

            <form id="stayBookingForm" class="car-booking-form">
              <div class="form-grid-2">
                <div class="form-field">
                  <label for="staySelect" data-i18n="stayChoiceLabel">Penginapan pilihan</label>
                  <select id="staySelect" required></select>
                </div>
                <div class="form-field">
                  <label for="stayRoomTypeSelect" data-i18n="stayRoomTypeLabel">Tipe kamar</label>
                  <select id="stayRoomTypeSelect">
                    <option value="standard" data-i18n="stayRoomStandard">Standard Syariah (1× tarif dasar)</option>
                    <option value="deluxe" data-i18n="stayRoomDeluxe">Deluxe Keluarga Syariah (+35%)</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-field">
                  <label for="stayCheckInInput" data-i18n="stayCheckInLabel">Tanggal check-in</label>
                  <input type="date" id="stayCheckInInput" required />
                </div>
                <div class="form-field">
                  <label for="stayNightsInput" data-i18n="stayNightsLabel">Durasi (malam)</label>
                  <input type="number" id="stayNightsInput" min="1" max="14" value="2" required />
                </div>
                <div class="form-field">
                  <label for="stayRoomsSelect" data-i18n="stayRoomsLabel">Jumlah kamar</label>
                  <select id="stayRoomsSelect">
                    <option value="1" selected>1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="stayGuestsInput" data-i18n="stayGuestsLabel">Jumlah tamu</label>
                  <input type="number" id="stayGuestsInput" min="1" max="12" value="2" required />
                </div>
                <div class="form-field">
                  <label for="stayNameInput" data-i18n="stayContactNameLabel">Nama tamu / pemesan</label>
                  <input type="text" id="stayNameInput" maxlength="80" required />
                </div>
              </div>

              <div class="form-field">
                <label for="stayPhoneInput" data-i18n="stayContactPhoneLabel">Nomor WhatsApp / Telepon</label>
                <input type="tel" id="stayPhoneInput" minlength="6" maxlength="24" placeholder="0812..." required />
              </div>

              <div class="form-field">
                <label for="stayNotesInput" data-i18n="stayNotesLabel">Catatan khusus (opsional)</label>
                <input
                  type="text"
                  id="stayNotesInput"
                  maxlength="240"
                  data-i18n-placeholder="stayNotesPlaceholder"
                  placeholder="Misal: Mohon tambahan sajadah, kamar non-smoking, check-in pukul 14.00 WIB."
                />
              </div>

              <div class="budget-summary" id="stayEstimateBox" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary" data-i18n="staySubmitBtn">
                Buat Pemesanan Penginapan
              </button>
            </form>
          </article>

          <article class="panel" aria-labelledby="stayListHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="stayListIdx">02. Reservasi Tersimpan</p>
              <h3 id="stayListHeading" data-i18n="stayListTitle">Daftar Pemesanan Penginapan</h3>
            </div>
            <div class="car-bookings-list" id="stayBookingsList"></div>
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
