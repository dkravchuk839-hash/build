window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.SessionForm = (() => {
  const { Format, Validate, DOM } = App.Utils;

  async function openModal(session, projectId, onSave) {
    const isEdit = !!session;
    const settings = await App.DB.settings.get();
    const projects = await App.DB.projects.getAll();
    const activeProjects = projects.filter(p => p.status === 'active');
    const pendingPhotoIds = [];

    const today = Format.todayISO();
    const defaultRate = settings.defaultHourlyRate || 15;

    const projOptions = (isEdit ? projects : activeProjects).map(p =>
      `<option value="${p.id}" ${(session?.projectId || projectId) === p.id ? 'selected' : ''}>${escHtml(p.name)}</option>`
    ).join('');

    const backdrop = DOM.openModal(`
      <div class="modal">
        <div class="modal-header">
          <h2>${isEdit ? 'Редагувати сесію' : 'Нова робоча сесія'}</h2>
          <button class="modal-close">${svgX()}</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <div class="form-group">
              <label class="form-label">Проєкт <span class="required">*</span></label>
              <select class="form-select" name="projectId">${projOptions}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Дата <span class="required">*</span></label>
              <input class="form-input" type="date" name="date" value="${session?.date || today}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Початок <span class="required">*</span></label>
                <input class="form-input" type="time" name="startTime" value="${session?.startTime || '08:00'}">
              </div>
              <div class="form-group">
                <label class="form-label">Кінець <span class="required">*</span></label>
                <input class="form-input" type="time" name="endTime" value="${session?.endTime || '17:00'}">
              </div>
            </div>

            <div class="amount-display">
              <div>
                <div class="amount-label">Тривалість</div>
                <div id="duration-display">—</div>
              </div>
              <div style="text-align:right">
                <div class="amount-label">Сума</div>
                <div class="amount-value" id="amount-display">€0.00</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Ставка (€/год)</label>
                <input class="form-input" type="number" name="hourlyRate" step="0.5" min="0" value="${session?.hourlyRate ?? defaultRate}">
              </div>
              <div style="display:flex;align-items:flex-end">
                <div class="form-group" style="flex:1">
                  <label class="form-label">Годин</label>
                  <input class="form-input" type="number" name="durationHours" step="0.25" min="0" value="${session?.durationHours || ''}">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Опис робіт</label>
              <textarea class="form-textarea" name="description" placeholder="Укладання плитки, монтаж перегородок…">${escHtml(session?.description)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Місцезнаходження</label>
              <div class="geo-group">
                <input class="form-input" name="locationName" value="${escHtml(session?.locationName)}" placeholder="Адреса об'єкту">
                <button class="btn-geo" id="geo-btn" title="Визначити GPS">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                </button>
              </div>
              <input type="hidden" name="latitude" value="${session?.latitude || ''}">
              <input type="hidden" name="longitude" value="${session?.longitude || ''}">
            </div>

            <div class="form-group">
              <label class="form-label">Фото</label>
              <div class="photo-grid" id="photo-grid">
                <label class="photo-upload-btn" title="Додати фото">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span>Фото</span>
                  <input type="file" accept="image/*" multiple capture="environment" id="photo-input" style="display:none">
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn-danger btn-sm" id="del-session-btn">Видалити</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn btn-secondary" id="cancel-session">Скасувати</button>
          <button class="btn btn-primary" id="save-session-btn">${isEdit ? 'Зберегти' : 'Додати'}</button>
        </div>
      </div>
    `);

    const modal = backdrop.querySelector('.modal');

    const startInput = modal.querySelector('[name="startTime"]');
    const endInput   = modal.querySelector('[name="endTime"]');
    const rateInput  = modal.querySelector('[name="hourlyRate"]');
    const durInput   = modal.querySelector('[name="durationHours"]');
    const durDisplay = modal.querySelector('#duration-display');
    const amtDisplay = modal.querySelector('#amount-display');

    function updateCalc() {
      const start = startInput.value;
      const end   = endInput.value;
      const rate  = parseFloat(rateInput.value) || 0;
      if (start && end) {
        const dur = Format.calcDuration(start, end);
        durInput.value = dur.toFixed(2);
        durDisplay.textContent = Format.duration(dur);
        amtDisplay.textContent = Format.currency(dur * rate);
      } else if (durInput.value) {
        const dur = parseFloat(durInput.value) || 0;
        durDisplay.textContent = Format.duration(dur);
        amtDisplay.textContent = Format.currency(dur * rate);
      }
    }

    [startInput, endInput, rateInput, durInput].forEach(el => el.addEventListener('input', updateCalc));
    updateCalc();

    /* GPS */
    const geoBtn = modal.querySelector('#geo-btn');
    geoBtn.addEventListener('click', async () => {
      geoBtn.disabled = true;
      try {
        const pos = await App.Services.Geo.getAndGeocode();
        modal.querySelector('[name="locationName"]').value = pos.address;
        modal.querySelector('[name="latitude"]').value = pos.lat;
        modal.querySelector('[name="longitude"]').value = pos.lng;
        DOM.toast('Геолокацію визначено', 'success');
      } catch (e) { DOM.toast(e.message, 'error'); }
      geoBtn.disabled = false;
    });

    /* Photos — load existing if editing */
    const photoGrid = modal.querySelector('#photo-grid');
    if (isEdit && session.photoIds?.length) {
      for (const pid of session.photoIds) {
        const photo = await App.DB.photos.getById(pid);
        if (photo) {
          const thumb = App.Services.Photos.thumbEl(photo, id => {
            const idx = pendingPhotoIds.indexOf(id);
            if (idx > -1) pendingPhotoIds.splice(idx, 1);
          });
          photoGrid.insertBefore(thumb, photoGrid.lastElementChild);
          pendingPhotoIds.push(pid);
        }
      }
    }

    modal.querySelector('#photo-input').addEventListener('change', async e => {
      const files = e.target.files;
      if (!files.length) return;
      const projectId = modal.querySelector('[name="projectId"]').value;
      for (const file of files) {
        const photo = await App.Services.Photos.storePhoto(file, { projectId, sessionId: session?.id || null });
        pendingPhotoIds.push(photo.id);
        const thumb = App.Services.Photos.thumbEl(photo, id => {
          const idx = pendingPhotoIds.indexOf(id);
          if (idx > -1) pendingPhotoIds.splice(idx, 1);
        });
        photoGrid.insertBefore(thumb, photoGrid.lastElementChild);
      }
      e.target.value = '';
    });

    /* Cancel */
    modal.querySelector('#cancel-session').addEventListener('click', () => DOM.closeModal(backdrop));

    /* Delete */
    if (isEdit) {
      modal.querySelector('#del-session-btn').addEventListener('click', async () => {
        const ok = await DOM.confirm('Видалити сесію?', 'Ця дія незворотна.');
        if (!ok) return;
        await App.DB.workSessions.delete(session.id);
        DOM.closeModal(backdrop);
        DOM.toast('Сесію видалено');
        if (onSave) onSave();
      });
    }

    /* Save */
    modal.querySelector('#save-session-btn').addEventListener('click', async () => {
      const pid = modal.querySelector('[name="projectId"]').value;
      const date = modal.querySelector('[name="date"]').value;
      const startTime = startInput.value;
      const endTime   = endInput.value;
      const durationHours = parseFloat(durInput.value) || 0;
      const hourlyRate    = parseFloat(rateInput.value) || 0;

      const errors = Validate.form({
        projectId: [Validate.required(pid, 'Проєкт')],
        date:      [Validate.required(date, 'Дата')],
        startTime: [Validate.required(startTime, 'Час початку')],
        endTime:   [Validate.required(endTime, 'Час кінця')],
      });
      Validate.showErrors(modal, errors);
      if (errors) return;

      const lat  = parseFloat(modal.querySelector('[name="latitude"]').value) || null;
      const lng  = parseFloat(modal.querySelector('[name="longitude"]').value) || null;

      /* Update photoIds to point to this session */
      for (const photoId of pendingPhotoIds) {
        const photo = await App.DB.photos.getById(photoId);
        if (photo && !photo.sessionId) {
          await App.DB.photos.create({ ...photo, projectId: pid, sessionId: session?.id || null });
        }
      }

      const data = {
        id: session?.id || Format.uuid(),
        projectId: pid,
        date, startTime, endTime, durationHours,
        hourlyRate,
        totalAmount: durationHours * hourlyRate,
        description:  modal.querySelector('[name="description"]').value.trim(),
        locationName: modal.querySelector('[name="locationName"]').value.trim(),
        latitude: lat, longitude: lng,
        photoIds: [...pendingPhotoIds],
      };

      if (isEdit) await App.DB.workSessions.update(data.id, data);
      else await App.DB.workSessions.create(data);

      /* Update photo sessionIds */
      for (const photoId of pendingPhotoIds) {
        const photo = await App.DB.photos.getById(photoId);
        if (photo) await App.DB.photos.create({ ...photo, projectId: pid, sessionId: data.id });
      }

      DOM.closeModal(backdrop);
      DOM.toast(isEdit ? 'Сесію оновлено' : 'Сесію додано', 'success');
      App.Store.emit('sessions:changed', { projectId: pid });
      if (onSave) onSave(data);
    });

    return backdrop;
  }

  function svgX() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
  function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { openModal };
})();
