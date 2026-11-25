export function createDestinationsPageMarkup() {
  return `
    <section class="section section-surface" id="destinations" data-page="destinations" hidden aria-labelledby="destSectionTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="destKicker">Direktori Destinasi</p>
            <h2 id="destSectionTitle" data-i18n="destTitle">Destinasi Pilihan Aceh</h2>
            <p class="section-sub" data-i18n="destSub">
              Temukan informasi estimasi biaya masuk, fasilitas umum, dan catatan ketersediaan tempat ibadah.
            </p>
          </div>
          <div class="section-head-actions">
            <p class="section-note" id="destResultCount"></p>
            <a href="/peta" class="btn btn-light btn-sm" data-nav-page="region-map">
              <span data-i18n="openMapPageBtn">Buka Peta Wilayah</span> →
            </a>
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>

        <div class="filter-toolbar" role="region" aria-label="Filter destinasi">
          <div class="category-tabs" id="categoryTabs" role="tablist" aria-label="Filter kategori"></div>
          <div class="filter-controls">
            <div class="input-wrap">
              <label class="sr-only" for="searchInput" data-i18n="searchLabel">Cari destinasi</label>
              <input
                type="search"
                class="field"
                id="searchInput"
                data-i18n-placeholder="searchPlaceholder"
                placeholder="Cari nama atau wilayah..."
              />
            </div>
            <label class="sr-only" for="regionFilter" data-i18n="regionLabel">Wilayah</label>
            <select class="field" id="regionFilter"></select>
            <label class="sr-only" for="sortFilter" data-i18n="sortLabel">Urutkan</label>
            <select class="field" id="sortFilter"></select>
            <button type="button" class="btn btn-outline btn-sm hidden" id="resetFiltersBtn" data-i18n="resetFilters">
              Reset Filter
            </button>
          </div>
        </div>

        <div class="cards-grid" id="destinationCards"></div>

        <div class="car-workspace-grid page-booking-workspace" id="destBookingWorkspace">
          <article class="panel" aria-labelledby="destFormHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="destFormIdx">01. Pemesanan Tiket Destinasi</p>
              <h3 id="destFormHeading" data-i18n="destFormTitle">Pesan Tiket Kunjungan Destinasi</h3>
            </div>

            <form id="destBookingForm" class="car-booking-form">
              <div class="form-field">
                <label for="destBookingSelect" data-i18n="destChoiceLabel">Destinasi pilihan</label>
                <select id="destBookingSelect" required></select>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="destBookingDateInput" data-i18n="destDateLabel">Tanggal kunjungan</label>
                  <input type="date" id="destBookingDateInput" required />
                </div>
                <div class="form-field">
                  <label for="destBookingQtyInput" data-i18n="destQtyLabel">Jumlah tiket / pengunjung</label>
                  <input type="number" id="destBookingQtyInput" min="1" max="50" value="2" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="destBookingNameInput" data-i18n="destNameLabel">Nama pemesan</label>
                  <input type="text" id="destBookingNameInput" maxlength="80" required />
                </div>
                <div class="form-field">
                  <label for="destBookingPhoneInput" data-i18n="destPhoneLabel">Nomor WhatsApp / Telepon</label>
                  <input type="tel" id="destBookingPhoneInput" minlength="6" maxlength="24" placeholder="0812..." required />
                </div>
              </div>

              <div class="form-field">
                <label for="destBookingNotesInput" data-i18n="destNotesLabel">Catatan kunjungan (opsional)</label>
                <input
                  type="text"
                  id="destBookingNotesInput"
                  maxlength="240"
                  data-i18n-placeholder="destNotesPlaceholder"
                  placeholder="Misal: Rombongan keluarga pagi hari, butuh pemandu lokal."
                />
              </div>

              <div class="budget-summary" id="destEstimateBox" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary" data-i18n="destSubmitBtn">
                Buat Pemesanan Tiket Destinasi
              </button>
            </form>
          </article>

          <article class="panel" aria-labelledby="destListHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="destListIdx">02. Tiket Destinasi Tersimpan</p>
              <h3 id="destListHeading" data-i18n="destListTitle">Daftar Pemesanan Destinasi</h3>
            </div>
            <div class="car-bookings-list" id="destBookingsList"></div>
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
