import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { regions } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/format.js';
import { navigateToPage } from '../utils/router.js';
import { openDetailModal } from './Modals.js';

let mapInstance = null;
let markerLayerGroup = null;
let layerControlInstance = null;
const destinationMarkers = new Map();

function createPinIcon(variant = 'destination') {
  const fill = variant === 'region' ? '#d4a64a' : '#075b46';
  const stroke = '#ffffff';
  const size = variant === 'region' ? 28 : 22;
  return L.divIcon({
    className: 'aceh-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.6" fill="#ffffff" stroke="none"/>
      </svg>
    `,
  });
}

export function initAcehMap() {
  const el = document.getElementById('acehMap');
  if (!el) return;

  mapInstance = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
    minZoom: 4,
  }).setView([5.15, 96.05], 8);

  const atlas = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  });

  const street = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }
  );

  const topo = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }
  );

  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri',
    }
  );

  atlas.addTo(mapInstance);
  layerControlInstance = L.control
    .layers(
      {
        [store.t('mapLayerAtlas')]: atlas,
        [store.t('mapLayerStreet')]: street,
        [store.t('mapLayerTopo')]: topo,
        [store.t('mapLayerSatellite')]: satellite,
      },
      null,
      { collapsed: true, position: 'topright' }
    )
    .addTo(mapInstance);

  L.control.scale({ imperial: false }).addTo(mapInstance);
  markerLayerGroup = L.layerGroup().addTo(mapInstance);

  const focusBtn = document.getElementById('focusAcehBtn');
  focusBtn?.addEventListener('click', () => {
    mapInstance?.flyTo([5.15, 96.05], 8, { duration: 0.9 });
  });

  renderMapMarkers();
  setTimeout(() => mapInstance?.invalidateSize(), 250);
}

export function renderMapMarkers() {
  const { lang, destinations } = store.getState();

  const pillsHost = document.getElementById('mapRegionButtons');
  if (pillsHost) {
    pillsHost.innerHTML = regions
      .map(
        (r) => `
          <button
            type="button"
            class="btn btn-outline btn-sm"
            data-map-region="${escapeHtml(r.name)}"
          >
            ${escapeHtml(r.name)}
          </button>
        `
      )
      .join('');

    pillsHost.querySelectorAll('button[data-map-region]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-map-region');
        const reg = regions.find((r) => r.name === name);
        if (reg && mapInstance) {
          mapInstance.flyTo(reg.coords, reg.zoom, { duration: 0.9 });
        }
      });
    });
  }

  if (!mapInstance || !markerLayerGroup) return;

  markerLayerGroup.clearLayers();
  destinationMarkers.clear();

  regions.forEach((r) => {
    const marker = L.marker(r.coords, { icon: createPinIcon('region') }).addTo(markerLayerGroup);
    const summary = lang === 'en' ? r.summaryEn : r.summaryId;
    const popupEl = document.createElement('div');
    popupEl.innerHTML = `
      <strong>${escapeHtml(r.name)}</strong>
      <p style="margin:6px 0 8px;font-size:12px;color:#4a5d56;">${escapeHtml(summary)}</p>
      <a
        href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ', Aceh')}"
        target="_blank"
        rel="noopener noreferrer"
        style="font-size:12px;font-weight:600;color:#075b46;text-decoration:underline;"
      >
        Google Maps
      </a>
    `;
    marker.bindPopup(popupEl);
  });

  destinations.forEach((d) => {
    if (!Array.isArray(d.coords) || d.coords.length !== 2) return;
    const marker = L.marker(d.coords, { icon: createPinIcon('destination') }).addTo(markerLayerGroup);
    const popupEl = document.createElement('div');
    popupEl.innerHTML = `
      <strong>${escapeHtml(d.name)}</strong>
      <p style="margin:4px 0 8px;font-size:12px;color:#4a5d56;">${escapeHtml(d.category)} · ${escapeHtml(d.region)}</p>
      <button type="button" class="map-popup-detail-btn" style="border:0;background:#075b46;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
        ${escapeHtml(store.t('btnDetail'))}
      </button>
    `;
    popupEl.querySelector('.map-popup-detail-btn')?.addEventListener('click', () => {
      openDetailModal(d.id);
    });
    marker.bindPopup(popupEl);
    destinationMarkers.set(d.id, marker);
  });

  // Update layer control if language changed
  if (layerControlInstance) {
    // Keep current tile layers; labels stay clean
  }
}

export function refreshAcehMapSize() {
  if (!mapInstance) return;
  setTimeout(() => {
    mapInstance?.invalidateSize();
  }, 80);
}

export function focusDestinationOnMap(destinationId) {
  const dest = store.getState().destinations.find((d) => d.id === destinationId);
  if (!dest || !mapInstance) return;
  navigateToPage('region-map');
  setTimeout(() => {
    mapInstance.invalidateSize();
    mapInstance.flyTo(dest.coords, 13, { duration: 0.9 });
    const marker = destinationMarkers.get(destinationId);
    if (marker) marker.openPopup();
  }, 220);
}
