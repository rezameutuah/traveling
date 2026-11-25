import { exploreGroups, galleryItems, carePillars } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/format.js';
import { navigateToPage } from '../utils/router.js';

export function attachImageFallback(container) {
  container.querySelectorAll('img[data-fallback-title]').forEach((imgEl) => {
    imgEl.addEventListener(
      'error',
      () => {
        const title = imgEl.getAttribute('data-fallback-title') || 'Discover Aceh';
        const fallback = document.createElement('div');
        fallback.className = 'img-fallback';
        fallback.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="8.5" cy="9.5" r="1.5"/>
            <path d="M21 15l-5-5L5 20"/>
          </svg>
          <span>${escapeHtml(title)}</span>
        `;
        imgEl.replaceWith(fallback);
      },
      { once: true }
    );
  });
}

export function renderExploreGroups() {
  const host = document.getElementById('exploreGroupsGrid');
  if (!host) return;
  const { lang } = store.getState();

  host.innerHTML = exploreGroups
    .map((group) => {
      const kicker = lang === 'en' ? group.kickerEn : group.kickerId;
      const title = lang === 'en' ? group.titleEn : group.titleId;
      const desc = lang === 'en' ? group.descEn : group.descId;
      const cta = lang === 'en' ? group.ctaEn : group.ctaId;
      return `
        <article class="group-card">
          <img
            src="${escapeHtml(group.photo)}"
            alt="${escapeHtml(title)}"
            loading="lazy"
            referrerpolicy="no-referrer"
            data-fallback-title="${escapeHtml(title)}"
          />
          <div class="group-overlay">
            <p class="group-subtitle">${escapeHtml(kicker)}</p>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(desc)}</p>
            <button
              type="button"
              class="btn btn-gold btn-sm"
              data-group-cat="${escapeHtml(group.category)}"
              data-group-query="${escapeHtml(group.query)}"
            >
              ${escapeHtml(cta)}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  attachImageFallback(host);

  host.querySelectorAll('button[data-group-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-group-cat') || '';
      const search = btn.getAttribute('data-group-query') || '';
      store.setFilter({ category, region: '', search });
      navigateToPage('destinations');
    });
  });
}

export function renderGallery() {
  const host = document.getElementById('galleryGrid');
  if (!host) return;
  const { lang } = store.getState();

  host.innerHTML = galleryItems
    .map((item) => {
      const title = lang === 'en' ? item.titleEn : item.titleId;
      const sub = lang === 'en' ? item.subEn : item.subId;
      const alt = lang === 'en' ? item.altEn : item.altId;
      return `
        <figure
          class="gallery-item ${item.wide ? 'is-wide' : ''}"
          tabindex="0"
          role="button"
          data-gallery-cat="${escapeHtml(item.category)}"
          aria-label="${escapeHtml(title)}"
        >
          <img
            src="${escapeHtml(item.photo)}"
            alt="${escapeHtml(alt)}"
            loading="lazy"
            referrerpolicy="no-referrer"
            data-fallback-title="${escapeHtml(title)}"
          />
          <figcaption>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(sub)}</span>
          </figcaption>
        </figure>
      `;
    })
    .join('');

  attachImageFallback(host);

  host.querySelectorAll('.gallery-item').forEach((fig) => {
    const activate = () => {
      const category = fig.getAttribute('data-gallery-cat') || '';
      store.setFilter({ category, region: '', search: '' });
      navigateToPage('destinations');
    };
    fig.addEventListener('click', activate);
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });
}

export function renderCarePillars() {
  const host = document.getElementById('pillarsGrid');
  if (!host) return;
  const { lang } = store.getState();

  host.innerHTML = carePillars
    .map((p) => {
      const kicker = lang === 'en' ? p.kickerEn : p.kickerId;
      const title = lang === 'en' ? p.titleEn : p.titleId;
      const desc = lang === 'en' ? p.descEn : p.descId;
      return `
        <article class="pillar-item">
          <p class="pillar-kicker">${escapeHtml(kicker)}</p>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
        </article>
      `;
    })
    .join('');
}

const HOME_PORTAL_PAGES = [
  {
    page: 'destinations',
    index: '01',
    titleKey: 'navDest',
    descId: 'Direktori destinasi wisata Aceh lengkap dengan filter kategori dan wilayah.',
    descEn: 'Curated Aceh attractions with category and regional filters.',
  },
  {
    page: 'region-map',
    index: '02',
    titleKey: 'navMap',
    descId: 'Peta interaktif Leaflet lima wilayah utama dan titik koordinat destinasi Aceh.',
    descEn: 'Interactive Leaflet map of Aceh regions and destination coordinates.',
  },
  {
    page: 'gallery',
    index: '03',
    titleKey: 'navGallery',
    descId: 'Sorotan visual pesisir, dataran tinggi Gayo, air terjun, dan masjid ikonik.',
    descEn: 'Visual highlights of Aceh coastlines, Gayo highlands, waterfalls, and iconic mosques.',
  },
  {
    page: 'culinary',
    index: '04',
    titleKey: 'navFood',
    descId: 'Kuliner khas dan produk UMKM lokal dengan status verifikasi halal serta kontak usaha.',
    descEn: 'Signature dishes and local SME goods with halal status notes and direct contacts.',
  },
  {
    page: 'stay',
    index: '05',
    titleKey: 'navStay',
    descId: 'Katalog penginapan ramah Muslim lengkap dengan foto kamar dan formulir reservasi.',
    descEn: 'Muslim-friendly accommodations with room photos and an interactive booking form.',
  },
  {
    page: 'waterboom',
    index: '06',
    titleKey: 'navWaterboom',
    descId: 'Daftar lengkap 7 waterboom Aceh termasuk Mata Ie Hillside dan Wahana Impian Malaka.',
    descEn: 'Complete catalog of 7 Aceh waterparks including Mata Ie Hillside and Malaka.',
  },
  {
    page: 'travel-car',
    index: '07',
    titleKey: 'navCar',
    descId: 'Pilihan armada mobil travel beserta foto unit, estimasi sewa, dan form pemesanan.',
    descEn: 'Private and group travel car fleet with unit photos, rate calculator, and booking.',
  },
  {
    page: 'planner',
    index: '08',
    titleKey: 'navPlan',
    descId: 'Penyusun itinerary 1–5 hari, kalkulator anggaran trip, paket wisata, dan favorit.',
    descEn: '1–5 day itinerary builder, trip cost calculator, tour packages, and favorites.',
  },
  {
    page: 'checklist',
    index: '09',
    titleKey: 'navChecklist',
    descId: 'Checklist persiapan perjalanan ramah Muslim yang tersimpan otomatis.',
    descEn: 'Muslim-friendly pre-departure preparation checklist saved automatically.',
  },
  {
    page: 'summary',
    index: '10',
    titleKey: 'navSummary',
    descId: 'Rekap seluruh pesanan dari setiap halaman, total biaya keseluruhan, dan semua data pilihan.',
    descEn: 'Combined totals from every booking page along with all your selected trip details.',
  },
];

export function renderHomePortal() {
  const host = document.getElementById('homePortalGrid');
  if (!host) return;
  const { lang } = store.getState();

  host.innerHTML = HOME_PORTAL_PAGES.map((item) => {
    const desc = lang === 'en' ? item.descEn : item.descId;
    return `
      <button type="button" class="portal-card" data-portal-page="${escapeHtml(item.page)}">
        <span class="portal-index tabular-nums">${escapeHtml(item.index)}</span>
        <strong class="portal-title">${escapeHtml(store.t(item.titleKey))}</strong>
        <p class="portal-desc">${escapeHtml(desc)}</p>
        <span class="portal-cta">${escapeHtml(store.t('portalOpenBtn'))} →</span>
      </button>
    `;
  }).join('');

  host.querySelectorAll('button[data-portal-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPage = btn.getAttribute('data-portal-page');
      if (targetPage) navigateToPage(targetPage);
    });
  });
}
