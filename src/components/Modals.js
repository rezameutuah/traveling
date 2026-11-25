import { categories, photoOptions, regions, stayPhotoOptions } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml, formatCurrency, sanitizeUrl, uid } from '../utils/format.js';
import { showToast } from '../utils/toast.js';
import { getCategoryLabel, selectDestinationForBooking } from './Destinations.js';
import { attachImageFallback } from './ExploreAndGallery.js';
import { focusDestinationOnMap } from './RegionMap.js';
import { navigateToLogin } from './LoginPage.js';
import { navigateToPage } from '../utils/router.js';

let activeDetailId = null;
let adminTab = 'destinations';
let editingId = null;
let pendingDeleteId = null;

export function initModals() {
  const detailModal = document.getElementById('detailModal');
  const adminModal = document.getElementById('adminModal');

  document.getElementById('closeDetailBtn')?.addEventListener('click', closeDetailModal);
  document.getElementById('closeAdminBtn')?.addEventListener('click', closeAdminModal);

  detailModal?.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetailModal();
  });

  adminModal?.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeAdminModal();
    }
  });
}

export function openDetailModal(id) {
  const modal = document.getElementById('detailModal');
  const titleEl = document.getElementById('detailTitle');
  const bodyEl = document.getElementById('detailBody');
  if (!modal || !titleEl || !bodyEl) return;

  const { lang, destinations, favorites } = store.getState();
  const dest = destinations.find((d) => d.id === id);
  if (!dest) return;

  activeDetailId = id;
  const isFav = favorites.includes(id);
  const photoUrl = sanitizeUrl(dest.photo);
  const costText = dest.cost === 0 ? store.t('freeEntry') : formatCurrency(dest.cost);

  titleEl.textContent = dest.name;
  bodyEl.innerHTML = `
    <div class="detail-photo">
      ${
        photoUrl
          ? `<img
              src="${escapeHtml(photoUrl)}"
              alt="${escapeHtml(dest.name)}"
              referrerpolicy="no-referrer"
              data-fallback-title="${escapeHtml(dest.name)}"
            />`
          : `<div class="img-fallback"><span>${escapeHtml(dest.name)}</span></div>`
      }
    </div>

    <div class="card-meta">
      <span>${escapeHtml(getCategoryLabel(dest.category, lang))}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(dest.region)}</span>
    </div>

    <p>${escapeHtml(dest.desc)}</p>

    <div class="detail-specs">
      <div>
        <span class="detail-spec-label">${escapeHtml(store.t('detailAddressLabel'))}</span>
        <span>${escapeHtml(dest.region)}, Aceh</span>
      </div>
      <div>
        <span class="detail-spec-label">${escapeHtml(store.t('detailCostLabel'))}</span>
        <span class="tabular-nums">${escapeHtml(costText)}</span>
      </div>
      <div>
        <span class="detail-spec-label">${escapeHtml(store.t('detailFacilitiesLabel'))}</span>
        <span>${escapeHtml((dest.facilities || []).join(', '))}</span>
      </div>
      <div>
        <span class="detail-spec-label">${escapeHtml(store.t('detailPrayerLabel'))}</span>
        <span>${escapeHtml(dest.prayer)}</span>
      </div>
    </div>

    <div class="panel-actions">
      <button type="button" class="btn btn-primary" id="detailBookDestBtn">
        ${escapeHtml(store.t('destBookBtn'))}
      </button>
      <button type="button" class="btn btn-light" id="detailAddTripBtn">
        ${escapeHtml(store.t('btnAddTrip'))}
      </button>
      <button type="button" class="btn btn-outline" id="detailFocusMapBtn">
        ${escapeHtml(store.t('detailFocusMap'))}
      </button>
      <button type="button" class="btn btn-outline" id="detailToggleFavBtn">
        ${isFav ? '♥' : '♡'} ${escapeHtml(isFav ? store.t('detailRemoveFav') : store.t('detailAddFav'))}
      </button>
      <a
        class="btn btn-outline"
        href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dest.name} ${dest.region} Aceh`)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${escapeHtml(store.t('detailGoogleMaps'))}
      </a>
    </div>
  `;

  attachImageFallback(bodyEl);

  document.getElementById('detailBookDestBtn')?.addEventListener('click', () => {
    closeDetailModal();
    navigateToPage('destinations');
    selectDestinationForBooking(dest.id);
  });

  document.getElementById('detailAddTripBtn')?.addEventListener('click', () => {
    store.addActivity(dest.id);
    showToast(store.t('toastActivityAdded'));
  });

  document.getElementById('detailFocusMapBtn')?.addEventListener('click', () => {
    closeDetailModal();
    focusDestinationOnMap(dest.id);
  });

  document.getElementById('detailToggleFavBtn')?.addEventListener('click', () => {
    const added = store.toggleFavorite(dest.id);
    showToast(added ? store.t('toastSavedFav') : store.t('toastRemovedFav'));
    openDetailModal(dest.id);
  });

  modal.hidden = false;
  document.getElementById('closeDetailBtn')?.focus();
}

export function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.hidden = true;
  activeDetailId = null;
}

export function openAdminModal() {
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  editingId = null;
  pendingDeleteId = null;
  modal.hidden = false;
  renderAdminBody();
  document.getElementById('closeAdminBtn')?.focus();
}

export function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.hidden = true;
}

export function renderAdminBody() {
  const modal = document.getElementById('adminModal');
  const bodyEl = document.getElementById('adminModalBody');
  if (!bodyEl || !modal || modal.hidden) return;

  const state = store.getState();
  const { lang, authUser, isAdmin } = state;

  if (!authUser) {
    bodyEl.innerHTML = `
      <div class="admin-form-box">
        <p>${escapeHtml(store.t('adminAuthRequired'))}</p>
        <div class="panel-actions">
          <button type="button" class="btn btn-primary" id="adminToLoginBtn">
            ${escapeHtml(store.t('navLoginBtn'))}
          </button>
        </div>
      </div>
    `;
    document.getElementById('adminToLoginBtn')?.addEventListener('click', () => {
      closeAdminModal();
      navigateToLogin(true);
    });
    return;
  }

  if (!isAdmin) {
    bodyEl.innerHTML = `
      <div class="admin-form-box">
        <p>${escapeHtml(store.t('adminForbidden'))}</p>
        <div class="panel-actions">
          <button type="button" class="btn btn-outline" id="adminToAccountBtn">
            ${escapeHtml(store.t('loginBackHome'))}
          </button>
        </div>
      </div>
    `;
    document.getElementById('adminToAccountBtn')?.addEventListener('click', closeAdminModal);
    return;
  }

  const list = state[adminTab] || [];
  const editingItem = editingId ? list.find((x) => x.id === editingId) : null;

  const tabLabels =
    lang === 'en'
      ? {
          destinations: 'Destinations',
          foods: 'Cuisine & SME',
          stays: 'Stays',
          packages: 'Packages',
        }
      : {
          destinations: 'Destinasi',
          foods: 'Kuliner & UMKM',
          stays: 'Akomodasi',
          packages: 'Paket Wisata',
        };

  let formFieldsHtml = '';
  if (adminTab === 'destinations') {
    formFieldsHtml = `
      <div class="form-field">
        <label for="admName">${lang === 'en' ? 'Destination Name' : 'Nama Destinasi'}</label>
        <input type="text" id="admName" name="name" required value="${escapeHtml(editingItem?.name || '')}" />
      </div>
      <div class="form-field">
        <label for="admCategory">${lang === 'en' ? 'Category' : 'Kategori'}</label>
        <select id="admCategory" name="category">
          ${categories
            .map(
              (c) =>
                `<option value="${escapeHtml(c)}" ${editingItem?.category === c ? 'selected' : ''}>${escapeHtml(
                  getCategoryLabel(c, lang)
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admRegion">${lang === 'en' ? 'Region' : 'Wilayah'}</label>
        <select id="admRegion" name="region">
          ${regions
            .map(
              (r) =>
                `<option value="${escapeHtml(r.name)}" ${editingItem?.region === r.name ? 'selected' : ''}>${escapeHtml(
                  r.name
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admCost">${lang === 'en' ? 'Estimated Cost (IDR)' : 'Estimasi Biaya Masuk (Rp)'}</label>
        <input type="number" id="admCost" name="cost" min="0" required value="${escapeHtml(
          editingItem ? String(editingItem.cost) : '0'
        )}" />
      </div>
      <div class="form-field">
        <label for="admPhoto">${lang === 'en' ? 'Photo Asset' : 'Foto Destinasi'}</label>
        <select id="admPhoto" name="photo">
          ${photoOptions
            .map(
              (p) =>
                `<option value="${escapeHtml(p.url)}" ${editingItem?.photo === p.url ? 'selected' : ''}>${escapeHtml(
                  p.label
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admPrayer">${lang === 'en' ? 'Prayer Facility Note' : 'Catatan Fasilitas Ibadah'}</label>
        <input type="text" id="admPrayer" name="prayer" value="${escapeHtml(
          editingItem?.prayer || 'Masjid atau musala tersedia di sekitar area wisata.'
        )}" />
      </div>
      <div class="form-field full-span">
        <label for="admDesc">${lang === 'en' ? 'Description' : 'Deskripsi Singkat'}</label>
        <textarea id="admDesc" name="desc" rows="2" required>${escapeHtml(editingItem?.desc || '')}</textarea>
      </div>
    `;
  } else if (adminTab === 'foods') {
    formFieldsHtml = `
      <div class="form-field">
        <label for="admName">${lang === 'en' ? 'Product / Dish Name' : 'Nama Kuliner / Produk'}</label>
        <input type="text" id="admName" name="name" required value="${escapeHtml(editingItem?.name || '')}" />
      </div>
      <div class="form-field">
        <label for="admCategory">${lang === 'en' ? 'Type' : 'Jenis'}</label>
        <input type="text" id="admCategory" name="category" required value="${escapeHtml(
          editingItem?.category || 'Kuliner'
        )}" />
      </div>
      <div class="form-field">
        <label for="admRegion">${lang === 'en' ? 'Region' : 'Wilayah'}</label>
        <select id="admRegion" name="region">
          ${regions
            .map(
              (r) =>
                `<option value="${escapeHtml(r.name)}" ${editingItem?.region === r.name ? 'selected' : ''}>${escapeHtml(
                  r.name
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admPrice">${lang === 'en' ? 'Price (IDR)' : 'Harga (Rp)'}</label>
        <input type="number" id="admPrice" name="price" min="0" required value="${escapeHtml(
          editingItem ? String(editingItem.price) : '25000'
        )}" />
      </div>
      <div class="form-field">
        <label for="admStatus">${lang === 'en' ? 'Halal Verification Status' : 'Status Verifikasi'}</label>
        <input type="text" id="admStatus" name="status" required value="${escapeHtml(
          editingItem?.status || 'Perlu verifikasi BPJPH'
        )}" />
      </div>
      <div class="form-field">
        <label for="admContact">${lang === 'en' ? 'WhatsApp Number (62...)' : 'Kontak WhatsApp (62...)'}</label>
        <input type="text" id="admContact" name="contact" required value="${escapeHtml(
          editingItem?.contact || '6281234567000'
        )}" />
      </div>
      <div class="form-field full-span">
        <label for="admSource">${lang === 'en' ? 'Verification Note' : 'Keterangan Sumber'}</label>
        <input type="text" id="admSource" name="source" required value="${escapeHtml(editingItem?.source || '')}" />
      </div>
    `;
  } else if (adminTab === 'stays') {
    formFieldsHtml = `
      <div class="form-field">
        <label for="admName">${lang === 'en' ? 'Accommodation Name' : 'Nama Akomodasi'}</label>
        <input type="text" id="admName" name="name" required value="${escapeHtml(editingItem?.name || '')}" />
      </div>
      <div class="form-field">
        <label for="admRegion">${lang === 'en' ? 'Region' : 'Wilayah'}</label>
        <select id="admRegion" name="region">
          ${regions
            .map(
              (r) =>
                `<option value="${escapeHtml(r.name)}" ${editingItem?.region === r.name ? 'selected' : ''}>${escapeHtml(
                  r.name
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admPrice">${lang === 'en' ? 'Rate / Night (IDR)' : 'Tarif / Malam (Rp)'}</label>
        <input type="number" id="admPrice" name="price" min="0" required value="${escapeHtml(
          editingItem ? String(editingItem.price) : '280000'
        )}" />
      </div>
      <div class="form-field">
        <label for="admContact">${lang === 'en' ? 'WhatsApp Number (62...)' : 'Kontak WhatsApp (62...)'}</label>
        <input type="text" id="admContact" name="contact" required value="${escapeHtml(
          editingItem?.contact || '6281234567000'
        )}" />
      </div>
      <div class="form-field">
        <label for="admStayPhoto">${lang === 'en' ? 'Accommodation Photo' : 'Foto Penginapan'}</label>
        <select id="admStayPhoto" name="photo">
          ${stayPhotoOptions
            .map(
              (p) =>
                `<option value="${escapeHtml(p.url)}" ${editingItem?.photo === p.url ? 'selected' : ''}>${escapeHtml(
                  p.label
                )}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="admFacilities">${lang === 'en' ? 'General Facilities' : 'Fasilitas Umum'}</label>
        <input type="text" id="admFacilities" name="facilities" required value="${escapeHtml(
          editingItem?.facilities || ''
        )}" />
      </div>
      <div class="form-field full-span">
        <label for="admMuslim">${lang === 'en' ? 'Muslim-Friendly Amenities' : 'Fasilitas Ramah Muslim'}</label>
        <input type="text" id="admMuslim" name="muslim" required value="${escapeHtml(editingItem?.muslim || '')}" />
      </div>
    `;
  } else {
    formFieldsHtml = `
      <div class="form-field">
        <label for="admName">${lang === 'en' ? 'Package Name' : 'Nama Paket'}</label>
        <input type="text" id="admName" name="name" required value="${escapeHtml(editingItem?.name || '')}" />
      </div>
      <div class="form-field">
        <label for="admDuration">${lang === 'en' ? 'Duration (days)' : 'Durasi (hari)'}</label>
        <input type="number" id="admDuration" name="duration" min="1" max="5" required value="${escapeHtml(
          editingItem ? String(editingItem.duration) : '2'
        )}" />
      </div>
      <div class="form-field">
        <label for="admCost">${lang === 'en' ? 'Estimated Cost / Person (IDR)' : 'Estimasi Biaya / Orang (Rp)'}</label>
        <input type="number" id="admCost" name="cost" min="0" required value="${escapeHtml(
          editingItem ? String(editingItem.cost) : '750000'
        )}" />
      </div>
      <div class="form-field">
        <label for="admInterest">${lang === 'en' ? 'Primary Interest' : 'Minat Utama'}</label>
        <select id="admInterest" name="interest">
          ${categories
            .map(
              (c) =>
                `<option value="${escapeHtml(c)}" ${
                  editingItem?.interests?.[0] === c ? 'selected' : ''
                }>${escapeHtml(getCategoryLabel(c, lang))}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="form-field full-span">
        <label for="admDesc">${lang === 'en' ? 'Summary' : 'Deskripsi Paket'}</label>
        <textarea id="admDesc" name="desc" rows="2" required>${escapeHtml(editingItem?.desc || '')}</textarea>
      </div>
    `;
  }

  bodyEl.innerHTML = `
    <div class="admin-tabs">
      <div class="category-tabs" role="tablist">
        ${Object.entries(tabLabels)
          .map(
            ([key, label]) => `
          <button
            type="button"
            class="tab-btn ${adminTab === key ? 'is-active' : ''}"
            data-admin-tab="${escapeHtml(key)}"
          >
            ${escapeHtml(label)}
          </button>
        `
          )
          .join('')}
      </div>

      <div class="list-row-actions">
        <button type="button" class="btn btn-outline btn-sm" id="exportCatalogBtn">
          ${lang === 'en' ? 'Export JSON' : 'Ekspor JSON'}
        </button>
        <button type="button" class="btn btn-outline btn-sm" id="resetCatalogBtn">
          ${lang === 'en' ? 'Reset Defaults' : 'Reset Data Awal'}
        </button>
      </div>
    </div>

    <form class="admin-form-box" id="adminCrudForm">
      <strong>${
        editingItem
          ? lang === 'en'
            ? `Edit: ${editingItem.name}`
            : `Ubah: ${editingItem.name}`
          : lang === 'en'
          ? `Add new entry (${tabLabels[adminTab]})`
          : `Tambah data baru (${tabLabels[adminTab]})`
      }</strong>
      <div class="admin-form-grid">
        ${formFieldsHtml}
      </div>
      <div class="list-row-actions">
        <button type="submit" class="btn btn-primary btn-sm">
          ${editingItem ? (lang === 'en' ? 'Save Changes' : 'Simpan Perubahan') : lang === 'en' ? 'Add Entry' : 'Tambahkan Data'}
        </button>
        ${
          editingItem
            ? `<button type="button" class="btn btn-outline btn-sm" id="cancelEditBtn">${escapeHtml(
                store.t('cancelAction')
              )}</button>`
            : ''
        }
      </div>
    </form>

    <div class="admin-list">
      ${list
        .map(
          (item) => `
        <div class="admin-item-row">
          <div class="list-row-main">
            <span class="list-row-title">${escapeHtml(item.name)}</span>
            <span class="list-row-sub">${escapeHtml(
              item.region || (item.duration ? `${item.duration} ${store.t('dayLabel')}` : '')
            )}</span>
          </div>
          <div class="list-row-actions">
            <button type="button" class="btn btn-light btn-sm" data-admin-edit="${escapeHtml(item.id)}">
              ${lang === 'en' ? 'Edit' : 'Ubah'}
            </button>
            ${
              pendingDeleteId === item.id
                ? `<button type="button" class="btn btn-danger-outline btn-sm" data-admin-confirm-del="${escapeHtml(
                    item.id
                  )}">${lang === 'en' ? 'Confirm' : 'Konfirmasi'}</button>
                   <button type="button" class="btn btn-outline btn-sm" data-admin-cancel-del>${escapeHtml(
                     store.t('cancelAction')
                   )}</button>`
                : `<button type="button" class="btn btn-outline btn-sm" data-admin-del="${escapeHtml(item.id)}">
                    ${escapeHtml(store.t('btnDelete'))}
                  </button>`
            }
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  bodyEl.querySelectorAll('button[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      adminTab = btn.getAttribute('data-admin-tab') || 'destinations';
      editingId = null;
      pendingDeleteId = null;
      renderAdminBody();
    });
  });

  document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
    editingId = null;
    renderAdminBody();
  });

  document.getElementById('resetCatalogBtn')?.addEventListener('click', () => {
    store.resetCatalogToDefaults();
    editingId = null;
    pendingDeleteId = null;
    showToast(store.t('toastDataReset'));
    renderAdminBody();
  });

  document.getElementById('exportCatalogBtn')?.addEventListener('click', () => {
    const s = store.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      destinations: s.destinations,
      foods: s.foods,
      stays: s.stays,
      packages: s.packages,
      savedTrips: s.savedTrips,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discover-aceh-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('adminCrudForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const raw = Object.fromEntries(formData.entries());
    const id = editingId || uid(adminTab[0]);

    if (adminTab === 'destinations') {
      const regObj = regions.find((r) => r.name === raw.region) || regions[0];
      store.upsertCatalogItem('destinations', {
        id,
        name: String(raw.name).trim(),
        category: String(raw.category),
        region: String(raw.region),
        cost: Math.max(0, Number(raw.cost) || 0),
        photo: String(raw.photo),
        prayer: String(raw.prayer).trim(),
        desc: String(raw.desc).trim(),
        facilities: editingItem?.facilities || ['Area publik', 'Akses transportasi'],
        coords: editingItem?.coords || regObj.coords,
      });
    } else if (adminTab === 'foods') {
      store.upsertCatalogItem('foods', {
        id,
        name: String(raw.name).trim(),
        category: String(raw.category).trim(),
        region: String(raw.region),
        price: Math.max(0, Number(raw.price) || 0),
        status: String(raw.status).trim(),
        verified: String(raw.status).toLowerCase().includes('terverifikasi'),
        contact: String(raw.contact).trim(),
        source: String(raw.source).trim(),
      });
    } else if (adminTab === 'stays') {
      store.upsertCatalogItem('stays', {
        id,
        name: String(raw.name).trim(),
        region: String(raw.region),
        price: Math.max(0, Number(raw.price) || 0),
        contact: String(raw.contact).trim(),
        photo: String(raw.photo || stayPhotoOptions[0].url),
        facilities: String(raw.facilities).trim(),
        muslim: String(raw.muslim).trim(),
      });
    } else {
      store.upsertCatalogItem('packages', {
        id,
        name: String(raw.name).trim(),
        duration: Math.min(5, Math.max(1, Number(raw.duration) || 2)),
        cost: Math.max(0, Number(raw.cost) || 0),
        interests: [String(raw.interest)],
        destinations: editingItem?.destinations || ['d1'],
        desc: String(raw.desc).trim(),
      });
    }

    editingId = null;
    pendingDeleteId = null;
    renderAdminBody();
  });

  bodyEl.querySelectorAll('button[data-admin-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingId = btn.getAttribute('data-admin-edit');
      pendingDeleteId = null;
      renderAdminBody();
    });
  });

  bodyEl.querySelectorAll('button[data-admin-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.getAttribute('data-admin-del');
      renderAdminBody();
    });
  });

  bodyEl.querySelectorAll('button[data-admin-cancel-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeleteId = null;
      renderAdminBody();
    });
  });

  bodyEl.querySelectorAll('button[data-admin-confirm-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-admin-confirm-del');
      if (id) store.deleteCatalogItem(adminTab, id);
      pendingDeleteId = null;
      if (editingId === id) editingId = null;
      renderAdminBody();
    });
  });
}

export function getActiveDetailId() {
  return activeDetailId;
}
