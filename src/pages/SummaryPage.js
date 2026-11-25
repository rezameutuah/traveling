export function createSummaryPageMarkup() {
  return `
    <section class="section section-surface" id="order-summary" data-page="summary" hidden aria-labelledby="summaryTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="summaryKicker">Halaman Terakhir · Rekapitulasi Lengkap</p>
            <h2 id="summaryTitle" data-i18n="summaryTitle">Ringkasan Semua Pilihan &amp; Total Pemesanan</h2>
            <p class="section-sub" data-i18n="summarySub">
              Seluruh pesanan dari halaman Destinasi, Kuliner, Akomodasi, Waterboom, dan Mobil Travel dijumlahkan otomatis di sini bersama seluruh data pilihan perjalanan Anda.
            </p>
          </div>
        </div>

        <div class="summary-grand-banner" id="summaryGrandBanner"></div>

        <div class="summary-block">
          <div class="summary-block-head">
            <h3 data-i18n="summaryBreakdownTitle">Rincian Total Per Halaman</h3>
          </div>
          <div class="summary-breakdown-grid" id="summaryBreakdownGrid"></div>
        </div>

        <div class="summary-block">
          <div class="summary-block-head">
            <h3 data-i18n="summaryOrdersHeading">Daftar Lengkap Pemesanan Tiap Halaman</h3>
          </div>
          <div class="summary-orders-stack" id="summaryOrdersContainer"></div>
        </div>

        <div class="summary-block">
          <div class="summary-block-head">
            <h3 data-i18n="summarySelectionsHeading">Seluruh Data Perjalanan &amp; Pilihan Anda</h3>
          </div>
          <div class="planner-grid" id="summarySelectionsGrid"></div>
        </div>
      </div>
    </section>
  `;
}
