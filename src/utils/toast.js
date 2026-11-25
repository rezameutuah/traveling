const toastRegion = () => document.getElementById('toastRegion');

export function showToast(message) {
  const host = toastRegion();
  if (!host) return;

  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  host.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 3200);
}
