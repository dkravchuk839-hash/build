window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

App.Utils.DOM = (() => {
  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') element.className = v;
      else if (k === 'html') element.innerHTML = v;
      else if (k.startsWith('on')) element.addEventListener(k.slice(2), v);
      else element.setAttribute(k, v);
    }
    children.forEach(child => {
      if (child == null) return;
      element.append(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return element;
  }

  function icon(paths, { size = 24, cls = '' } = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.width = size + 'px';
    svg.style.height = size + 'px';
    if (cls) svg.setAttribute('class', cls);
    svg.innerHTML = paths;
    return svg;
  }

  const ICONS = {
    clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    car:      '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    map:      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    camera:   '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    plus:     '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    home:     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    folder:   '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    pin:      '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    trash:    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    edit:     '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    back:     '<polyline points="15 18 9 12 15 6"/>',
    x:        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    search:   '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    share:    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    arrow:    '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    check:    '<polyline points="20 6 9 17 4 12"/>',
    gps:      '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  };

  function svgIcon(name, size = 20) {
    return icon(ICONS[name] || '', { size });
  }

  function openModal(html) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = html;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal(backdrop);
    });
    const closeBtn = backdrop.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(backdrop));
    return backdrop;
  }

  function closeModal(backdrop) {
    if (!backdrop) return;
    backdrop.style.animation = 'none';
    backdrop.style.opacity = '0';
    backdrop.style.transition = 'opacity .15s';
    setTimeout(() => backdrop.remove(), 150);
  }

  function toast(msg, type = '') {
    const tc = document.getElementById('toast-container');
    if (!tc) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  function confirm(title, message) {
    return new Promise(resolve => {
      const backdrop = openModal(`
        <div class="modal-backdrop" style="align-items:center">
          <div class="confirm-dialog">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-btns">
              <button class="btn btn-secondary" id="confirm-no">Скасувати</button>
              <button class="btn btn-danger" id="confirm-yes">Видалити</button>
            </div>
          </div>
        </div>
      `);
      backdrop.querySelector('#confirm-yes').addEventListener('click', () => { closeModal(backdrop); resolve(true); });
      backdrop.querySelector('#confirm-no').addEventListener('click', () => { closeModal(backdrop); resolve(false); });
    });
  }

  return { el, icon, svgIcon, ICONS, openModal, closeModal, toast, confirm };
})();
