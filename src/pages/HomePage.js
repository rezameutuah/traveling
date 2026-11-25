export function createHomePageMarkup() {
  return `
    <section class="hero" data-page="home" aria-labelledby="heroTitle">
      <div class="hero-backdrop" aria-hidden="true"></div>
      <div class="container hero-inner">
        <div class="hero-content">
          <p class="hero-kicker" data-i18n="heroKicker">Serambi Mekkah · Provinsi Aceh, Indonesia</p>
          <h1 id="heroTitle" data-i18n="heroTitle">Jelajahi Aceh dengan Nyaman dan Bermakna</h1>
          <p class="hero-desc" id="heroDesc" data-i18n="heroDesc">
            Dari arsitektur masjid bersejarah hingga pesisir Pulau Weh dan dataran tinggi Gayo. Rencanakan perjalanan ramah Muslim yang terukur dari awal hingga akhir.
          </p>

          <form class="hero-search" id="heroSearchForm" role="search">
            <label class="sr-only" for="heroSearch" data-i18n="heroSearchLabel">Cari destinasi wisata di Aceh</label>
            <input
              type="search"
              id="heroSearch"
              data-i18n-placeholder="heroSearchPlaceholder"
              placeholder="Cari destinasi, wilayah, atau kategori wisata..."
              autocomplete="off"
            />
            <button type="submit" class="btn btn-gold" data-i18n="heroSearchBtn">Cari Destinasi</button>
          </form>

          <div class="hero-utility-row">
            <div class="hero-stats" aria-label="Ringkasan katalog">
              <div class="stat-item">
                <span class="stat-value tabular-nums" id="heroDestCount">24</span>
                <span class="stat-label" data-i18n="statDestinations">Destinasi</span>
              </div>
              <span class="stat-sep" aria-hidden="true">·</span>
              <div class="stat-item">
                <span class="stat-value tabular-nums" id="heroRegionCount">5</span>
                <span class="stat-label" data-i18n="statRegions">Wilayah</span>
              </div>
              <span class="stat-sep" aria-hidden="true">·</span>
              <div class="stat-item">
                <span class="stat-value tabular-nums" id="heroCategoryCount">7</span>
                <span class="stat-label" data-i18n="statCategories">Kategori</span>
              </div>
            </div>

            <div class="utility-controls">
              <div class="lang-switch" role="group" aria-label="Pilihan bahasa">
                <button type="button" class="lang-btn is-active" data-lang="id">ID</button>
                <button type="button" class="lang-btn" data-lang="en">EN</button>
              </div>
              <button type="button" class="utility-link" id="openAdminHeroBtn" data-i18n="manageCatalog">Kelola Katalog</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-surface" id="experiences" data-page="home" aria-labelledby="expTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="expKicker">Eksplorasi Berdasarkan Minat</p>
            <h2 id="expTitle" data-i18n="expTitle">Pilih nuansa perjalanan Anda di Aceh</h2>
            <p class="section-sub" data-i18n="expSub">
              Saring katalog destinasi secara langsung berdasarkan lanskap alam, pesisir, ruang terbuka hijau, atau warisan sejarah.
            </p>
          </div>
        </div>
        <div class="group-grid" id="exploreGroupsGrid"></div>
      </div>
    </section>

    <section class="section section-canvas" id="page-portal" data-page="home" aria-labelledby="portalTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="portalKicker">Navigasi Halaman</p>
            <h2 id="portalTitle" data-i18n="portalTitle">Akses Langsung Layanan Wisata Aceh</h2>
            <p class="section-sub" data-i18n="portalSub">
              Pilih halaman khusus untuk langsung menjelajahi direktori destinasi, kuliner halal, penginapan syariah, waterboom, mobil travel, atau menyusun itinerary.
            </p>
          </div>
        </div>
        <div class="portal-grid" id="homePortalGrid"></div>
      </div>
    </section>

    <section class="section section-surface" id="standards" data-page="home" aria-labelledby="standardsTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="careKicker">Panduan Layanan</p>
            <h2 id="standardsTitle" data-i18n="careTitle">Prinsip Perjalanan yang Terinformasi</h2>
            <p class="section-sub" data-i18n="careSub">
              Gunakan informasi fasilitas sebagai referensi awal dan lakukan konfirmasi langsung kepada penyedia layanan setempat.
            </p>
          </div>
        </div>
        <div class="pillars-grid" id="pillarsGrid"></div>
      </div>
    </section>
  `;
}
