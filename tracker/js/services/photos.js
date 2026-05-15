window.App = window.App || {};
window.App.Services = window.App.Services || {};

App.Services.Photos = (() => {
  const MAX_PX = 1200;
  const QUALITY = 0.82;

  function resizeToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_PX || height > MAX_PX) {
            if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
            else { width = Math.round(width * MAX_PX / height); height = MAX_PX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', QUALITY));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function storePhoto(file, { projectId, sessionId = null, caption = '' }) {
    const { Utils: { Format } } = App;
    const dataUrl = await resizeToDataUrl(file);
    const photo = {
      id: Format.uuid(),
      projectId,
      sessionId,
      filename: file.name,
      mimeType: 'image/jpeg',
      dataUrl,
      sizeBytes: Math.round(dataUrl.length * 0.75),
      takenAt: new Date().toISOString(),
      caption,
    };
    await App.DB.photos.create(photo);
    return photo;
  }

  async function storeMultiple(files, opts) {
    return Promise.all([...files].map(f => storePhoto(f, opts)));
  }

  function thumbEl(photo, onDelete) {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    div.dataset.id = photo.id;
    div.innerHTML = `
      <img src="${photo.dataUrl}" alt="${photo.caption || photo.filename}" loading="lazy">
      <button class="photo-del" title="Видалити фото">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    div.querySelector('img').addEventListener('click', () => openLightbox(photo.dataUrl));
    div.querySelector('.photo-del').addEventListener('click', async e => {
      e.stopPropagation();
      await App.DB.photos.delete(photo.id);
      div.remove();
      if (onDelete) onDelete(photo.id);
    });
    return div;
  }

  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img src="${src}"><button class="lightbox-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox-close')) lb.remove(); });
  }

  return { storePhoto, storeMultiple, thumbEl, openLightbox };
})();
