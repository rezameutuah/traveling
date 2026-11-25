export function createPlannerPageMarkup() {
  return `
    <section class="section section-surface" id="planner" data-page="planner" hidden aria-labelledby="plannerTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="plannerKicker">Ruang Kerja Perjalanan</p>
            <h2 id="plannerTitle" data-i18n="plannerTitle">Rancang Itinerary & Anggaran Anda</h2>
            <p class="section-sub" data-i18n="plannerSub">
              Susun jadwal 1–5 hari, hitung proyeksi biaya secara langsung, cocokkan paket wisata, dan kelola daftar destinasi favorit.
            </p>
          </div>
          <div class="section-head-actions">
            <a href="/checklist" class="btn btn-light btn-sm" data-nav-page="checklist">
              <span data-i18n="openChecklistPageBtn">Buka Checklist Perjalanan</span> →
            </a>
            <a href="/ringkasan" class="btn btn-primary btn-sm" data-nav-page="summary">
              <span data-i18n="openSummaryPageBtn">Lihat Ringkasan &amp; Total</span> →
            </a>
          </div>
        </div>

        <div class="planner-grid">
          <article class="panel" aria-labelledby="itineraryHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="planIdx1">01. Penyusun Jadwal</p>
              <h3 id="itineraryHeading" data-i18n="planTitle1">Itinerary Perjalanan</h3>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="tripName" data-i18n="lblTripName">Nama perjalanan</label>
                <input type="text" id="tripName" value="Jelajah Aceh" maxlength="80" />
              </div>
              <div class="form-field">
                <label for="tripDate" data-i18n="lblTripDate">Tanggal mulai</label>
                <input type="date" id="tripDate" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="tripDays" data-i18n="lblTripDays">Durasi (hari)</label>
                <select id="tripDays">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3" selected>3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div class="form-field">
                <label for="travellers" data-i18n="lblTravellers">Jumlah wisatawan</label>
                <input type="number" id="travellers" min="1" max="50" value="2" />
              </div>
            </div>

            <div class="form-field">
              <label for="activitySelect" data-i18n="lblAddDest">Tambahkan destinasi ke jadwal</label>
              <div class="inline-add-row">
                <select id="activitySelect"></select>
                <select id="activityDaySelect" aria-label="Pilih hari"></select>
                <button type="button" class="btn btn-primary" id="addActivityBtn" data-i18n="btnAdd">Tambah</button>
              </div>
            </div>

            <div class="activity-list" id="activityList"></div>

            <div class="panel-actions">
              <button type="button" class="btn btn-light" id="saveTripBtn" data-i18n="btnSaveTrip">Simpan Itinerary</button>
              <button type="button" class="btn btn-outline btn-sm" id="shareTripBtn" data-i18n="btnShareTrip">Salin Ringkasan</button>
              <button type="button" class="btn btn-outline btn-sm" id="printTripBtn" data-i18n="btnPrintTrip">Cetak Itinerary</button>
            </div>

            <div class="saved-trips-block" id="savedTripsSection"></div>
          </article>

          <article class="panel" aria-labelledby="budgetHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="planIdx2">02. Kalkulator Biaya</p>
              <h3 id="budgetHeading" data-i18n="planTitle2">Estimasi Anggaran</h3>
              <p class="panel-desc" data-i18n="planDesc2">
                Perhitungan otomatis diperbarui saat nilai diubah. Angka merupakan estimasi perencanaan pribadi.
              </p>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="transportInput" data-i18n="lblTransport">Transportasi total (Rp)</label>
                <input type="number" id="transportInput" value="250000" min="0" step="10000" />
              </div>
              <div class="form-field">
                <label for="hotelInput" data-i18n="lblHotel">Akomodasi / malam (Rp)</label>
                <input type="number" id="hotelInput" value="300000" min="0" step="25000" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="mealInput" data-i18n="lblMeal">Konsumsi / orang / hari (Rp)</label>
                <input type="number" id="mealInput" value="100000" min="0" step="10000" />
              </div>
              <div class="form-field">
                <label for="ticketsInput" data-i18n="lblTickets">Tiket & aktivitas / orang / hari (Rp)</label>
                <input type="number" id="ticketsInput" value="75000" min="0" step="5000" />
              </div>
            </div>

            <div class="budget-summary" id="budgetBreakdown" aria-live="polite"></div>
          </article>

          <article class="panel" aria-labelledby="matcherHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="planIdx3">03. Rekomendasi Paket</p>
              <h3 id="matcherHeading" data-i18n="planTitle3">Pencocokan Paket Wisata</h3>
              <p class="panel-desc" data-i18n="planDesc3">
                Filter rute perjalanan berdasarkan minat utama, durasi maksimal, dan batas anggaran per orang.
              </p>
            </div>

            <div class="form-field">
              <label for="interestFilter" data-i18n="lblInterest">Minat utama</label>
              <select id="interestFilter"></select>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="recDays" data-i18n="lblMaxDays">Durasi maksimal (hari)</label>
                <select id="recDays">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3" selected>3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div class="form-field">
                <label for="recBudget" data-i18n="lblMaxBudget">Anggaran maks / orang (Rp)</label>
                <input type="number" id="recBudget" value="1500000" min="0" step="50000" />
              </div>
            </div>

            <div class="recommendations-list" id="recommendationsList"></div>
          </article>

          <article class="panel" aria-labelledby="favoritesHeading">
            <div class="panel-header">
              <p class="panel-index" data-i18n="planIdx4">04. Daftar Tersimpan</p>
              <h3 id="favoritesHeading" data-i18n="planTitle4">Destinasi Favorit</h3>
              <p class="panel-desc" data-i18n="planDesc4">
                Simpan destinasi incaran Anda dan tambahkan langsung ke penyusun jadwal kapan saja.
              </p>
            </div>

            <div class="favorites-list" id="favoritesList"></div>

            <div class="panel-actions" id="favoritesActions">
              <button type="button" class="btn btn-outline btn-sm" id="clearFavoritesBtn" data-i18n="btnClearFavs">
                Hapus Semua Favorit
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}
