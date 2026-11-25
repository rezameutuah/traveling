export function createCulinaryPageMarkup() {
  return `
    <section class="section section-surface" id="culinary" data-page="culinary" hidden aria-labelledby="culinaryTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="foodKicker">Cita Rasa &amp; UMKM</p>
            <h2 id="culinaryTitle" data-i18n="foodTitle">Kuliner &amp; Produk Lokal Aceh</h2>
            <p class="section-sub" data-i18n="foodSub">
              Sajian khas dan produk UMKM dengan transparansi status verifikasi halal serta kontak langsung pelaku usaha.
            </p>
          </div>
          <div class="section-head-actions">
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>
        <div class="catalog-grid" id="foodCards"></div>
        <p class="field-disclaimer" data-i18n="foodDisclaimer">
          Keterangan "Perlu verifikasi BPJPH" berarti sertifikat resmi belum ditautkan ke katalog ini dan bukan pernyataan non-halal. Periksa sertifikat resmi melalui kanal BPJPH atau konfirmasi langsung ke pelaku usaha.
        </p>

        <div class="car-workspace-grid page-booking-workspace" id="foodBookingWorkspace">
          <article class="panel" aria-labelledby="foodFormHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="foodFormIdx">01. Pemesanan Kuliner &amp; UMKM</p>
              <h3 id="foodFormHeading" data-i18n="foodFormTitle">Pesan Sajian Kuliner &amp; Produk UMKM</h3>
            </div>

            <form id="foodBookingForm" class="car-booking-form">
              <div class="form-field">
                <label for="foodBookingSelect" data-i18n="foodChoiceLabel">Menu / Produk UMKM pilihan</label>
                <select id="foodBookingSelect" required></select>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="foodBookingDateInput" data-i18n="foodDateLabel">Tanggal ambil / kirim</label>
                  <input type="date" id="foodBookingDateInput" required />
                </div>
                <div class="form-field">
                  <label for="foodBookingQtyInput" data-i18n="foodQtyLabel">Jumlah porsi / paket</label>
                  <input type="number" id="foodBookingQtyInput" min="1" max="50" value="2" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-field">
                  <label for="foodBookingNameInput" data-i18n="foodNameLabel">Nama pemesan</label>
                  <input type="text" id="foodBookingNameInput" maxlength="80" required />
                </div>
                <div class="form-field">
                  <label for="foodBookingPhoneInput" data-i18n="foodPhoneLabel">Nomor WhatsApp / Telepon</label>
                  <input type="tel" id="foodBookingPhoneInput" minlength="6" maxlength="24" placeholder="0812..." required />
                </div>
              </div>

              <div class="form-field">
                <label for="foodBookingNotesInput" data-i18n="foodNotesLabel">Catatan pesanan (opsional)</label>
                <input
                  type="text"
                  id="foodBookingNotesInput"
                  maxlength="240"
                  data-i18n-placeholder="foodNotesPlaceholder"
                  placeholder="Misal: Level pedas sedang, ambil pukul 17.00 WIB."
                />
              </div>

              <div class="budget-summary" id="foodEstimateBox" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary" data-i18n="foodSubmitBtn">
                Buat Pemesanan Kuliner
              </button>
            </form>
          </article>

          <article class="panel" aria-labelledby="foodListHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="foodListIdx">02. Pesanan Kuliner Tersimpan</p>
              <h3 id="foodListHeading" data-i18n="foodListTitle">Daftar Pemesanan Kuliner</h3>
            </div>
            <div class="car-bookings-list" id="foodBookingsList"></div>
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
