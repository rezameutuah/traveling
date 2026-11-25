export function createMapPageMarkup() {
  return `
    <section class="section section-surface" id="region-map" data-page="region-map" hidden aria-labelledby="mapTitle">
      <div class="container map-split">
        <div class="map-copy">
          <p class="section-kicker" data-i18n="mapKicker">Peta Interaktif Wilayah</p>
          <h2 id="mapTitle" data-i18n="mapTitle">Jelajahi Sebaran Destinasi Aceh</h2>
          <p class="section-sub" data-i18n="mapSub">
            Tinjau posisi lima wilayah utama—Banda Aceh, Sabang, Aceh Besar, Aceh Tengah, dan Bener Meriah—serta titik destinasi dalam mode peta jalan, topografi, atau citra satelit.
          </p>
          <div class="map-region-pills" id="mapRegionButtons"></div>
          <p class="field-disclaimer" data-i18n="mapDisclaimer">
            Koordinat penanda ditujukan untuk orientasi wilayah dan perencanaan rute awal. Gunakan tombol Google Maps pada detail destinasi untuk navigasi belokan demi belokan.
          </p>
          <div class="map-actions">
            <button type="button" class="btn btn-outline btn-sm" id="focusAcehBtn" data-i18n="mapFocusAceh">Fokus ke Aceh</button>
            <a href="/destinasi" class="btn btn-primary btn-sm" data-nav-page="destinations" data-i18n="navDest">Destinasi</a>
            <a
              class="btn btn-light btn-sm"
              href="https://www.openstreetmap.org/#map=8/4.9/96.0"
              target="_blank"
              rel="noopener noreferrer"
              data-i18n="mapOpenExternal"
            >
              Buka di OpenStreetMap
            </a>
          </div>
        </div>
        <div class="map-frame">
          <div
            id="acehMap"
            role="region"
            aria-label="Peta interaktif wilayah dan destinasi wisata Aceh"
          ></div>
        </div>
      </div>
    </section>
  `;
}
