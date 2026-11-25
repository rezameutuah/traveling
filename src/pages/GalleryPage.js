export function createGalleryPageMarkup() {
  return `
    <section class="section section-surface" id="gallery" data-page="gallery" hidden aria-labelledby="galleryTitle">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-kicker" data-i18n="galleryKicker">Sorotan Visual</p>
            <h2 id="galleryTitle" data-i18n="galleryTitle">Galeri Pesona Alam dan Budaya</h2>
            <p class="section-sub" data-i18n="gallerySub">
              Potret lanskap pesisir, perbukitan dataran tinggi, air terjun, dan ruang ibadah ikonik di seluruh penjuru Aceh.
            </p>
          </div>
          <p class="section-note" data-i18n="galleryNote">Klik foto untuk melihat kategori terkait</p>
        </div>
        <div class="gallery-grid" id="galleryGrid"></div>
      </div>
    </section>
  `;
}
