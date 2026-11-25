import { prepChecklistItems } from '../data/seed.js';
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/format.js';

export function initChecklistControls() {
  const resetBtn = document.getElementById('resetPrepBtn');
  resetBtn?.addEventListener('click', () => {
    store.resetPrepChecklist();
  });
}

export function renderChecklistSection() {
  const { lang, prepChecklist } = store.getState();
  const host = document.getElementById('prepChecklistGrid');
  const progressText = document.getElementById('prepProgressText');
  const progressBar = document.getElementById('prepProgressBar');

  if (!host) return;

  const doneCount = prepChecklistItems.filter((item) => Boolean(prepChecklist[item.key])).length;
  const totalCount = prepChecklistItems.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  if (progressText) {
    progressText.textContent = `${doneCount} / ${totalCount}`;
  }
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
  }

  host.innerHTML = prepChecklistItems
    .map((item) => {
      const label = lang === 'en' ? item.en : item.id;
      const checked = Boolean(prepChecklist[item.key]);
      return `
        <label class="prep-item">
          <input type="checkbox" data-prep-key="${escapeHtml(item.key)}" ${checked ? 'checked' : ''} />
          <span>${escapeHtml(label)}</span>
        </label>
      `;
    })
    .join('');

  host.querySelectorAll('input[data-prep-key]').forEach((box) => {
    box.addEventListener('change', () => {
      const key = box.getAttribute('data-prep-key');
      if (key) store.togglePrepItem(key, box.checked);
    });
  });
}
