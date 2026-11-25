export function createWaterboomPageMarkup() {
  return `
    <section class="section section-surface" id="waterboom" data-page="waterboom" hidden aria-labelledby="waterboomTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="waterboomKicker">Rekreasi Air Keluarga</p>
            <h2 id="waterboomTitle" data-i18n="waterboomTitle">Waterboom &amp; Taman Air Aceh</h2>
            <p class="section-sub" data-i18n="waterboomSub">
              Pilihan taman rekreasi air bernuansa alam untuk liburan keluarga dengan informasi wahana, perkiraan tiket masuk, dan fasilitas ibadah.
            </p>
          </div>
          <div class="section-head-actions">
            <p class="section-note" id="waterboomCount"></p>
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>
        <div class="filter-toolbar waterboom-toolbar">
          <div class="category-tabs" id="waterboomRegionTabs" role="tablist" aria-label="Filter wilayah waterboom"></div>
        </div>
        <div class="waterboom-grid" id="waterboomCards"></div>
        <p class="field-disclaimer" data-i18n="waterboomDisclaimer">
          Tarif tiket masuk dan jam operasional dapat berubah pada akhir pekan atau hari libur nasional. Gunakan pakaian renang yang sopan sesuai ketentuan pengelola setempat.
        </p>

        <div class="car-workspace-grid page-booking-workspace" id="waterboomBookingWorkspace">
          <article class="panel" aria-labelledby="wbFormHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="wbFormIdx">01. Pemesanan Tiket Waterboom</p>
              <h3 id="wbFormHeading" data-i18n="wbFormTitle">Pesan Tiket Masuk Waterboom Aceh</h3>
            </div>

            <form id="waterboomBookingForm" class="car-booking-form">
              <div class="form-field">
                <label for="wbBookingSelect" data-i18n="wbChoiceLabel">Waterboom pilihan</label>
                <select id="wbBookingSelect" required></select>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="wbBookingDateInput" data-i18n="wbDateLabel">Tanggal kunjungan</label>
                  <input type="date" id="wbBookingDateInput" required />
                </div>
                <div class="form-field">
                  <label for="wbBookingQtyInput" data-i18n="wbQtyLabel">Jumlah tiket masuk</label>
                  <input type="number" id="wbBookingQtyInput" min="1" max="50" value="3" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="wbBookingNameInput" data-i18n="wbNameLabel">Nama pemesan</label>
                  <input type="text" id="wbBookingNameInput" maxlength="80" required />
                </div>
                <div class="form-field">
                  <label for="wbBookingPhoneInput" data-i18n="wbPhoneLabel">Nomor WhatsApp / Telepon</label>
                  <input type="tel" id="wbBookingPhoneInput" minlength="6" maxlength="24" placeholder="0812..." required />
                </div>
              </div>

              <div class="form-field">
                <label for="wbBookingNotesInput" data-i18n="wbNotesLabel">Catatan kunjungan (opsional)</label>
                <input
                  type="text"
                  id="wbBookingNotesInput"
                  maxlength="240"
                  data-i18n-placeholder="wbNotesPlaceholder"
                  placeholder="Misal: Pesan gazebo keluarga dekat kolam anak."
                />
              </div>

              <div class="budget-summary" id="wbEstimateBox" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary" data-i18n="wbSubmitBtn">
                Buat Pemesanan Waterboom
              </button>
            </form>
          </article>

          <article class="panel" aria-labelledby="wbListHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="wbListIdx">02. Tiket Waterboom Tersimpan</p>
              <h3 id="wbListHeading" data-i18n="wbListTitle">Daftar Pemesanan Waterboom</h3>
            </div>
            <div class="car-bookings-list" id="wbBookingsList"></div>
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
