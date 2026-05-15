window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.Projects = (() => {
  const { Format, DOM } = App.Utils;

  async function render(params, container) {
    document.querySelector('.app-header h1').textContent = 'Проєкти';
    document.querySelector('.back-btn').classList.remove('visible');

    let projects = await App.DB.projects.getAll();
    projects.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));

    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <div class="projects-header">
        <div class="search-wrap" style="flex:1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="form-input search-input" id="proj-search" placeholder="Пошук проєктів…">
        </div>
        <button class="btn btn-primary btn-sm" id="new-proj-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новий
        </button>
      </div>
      <div id="proj-list"></div>
    `;

    container.innerHTML = '';
    container.appendChild(view);

    const list = view.querySelector('#proj-list');
    renderList(projects, list);

    view.querySelector('#proj-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = projects.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.clientName || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q)
      );
      renderList(filtered, list);
    });

    view.querySelector('#new-proj-btn').addEventListener('click', () => openProjectModal(null, async () => {
      projects = await App.DB.projects.getAll();
      projects.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
      renderList(projects, list);
    }));

    removeFAB();
  }

  function renderList(projects, list) {
    list.innerHTML = '';
    if (projects.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <h3>Немає проєктів</h3>
          <p>Натисніть "Новий" щоб створити перший проєкт</p>
        </div>
      `;
      return;
    }
    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const statusLabel = { active: 'Активний', completed: 'Завершено', archived: 'Архів' }[p.status] || p.status;
      const statusClass = { active: 'badge-active', completed: 'badge-completed', archived: 'badge-archived' }[p.status] || '';
      card.innerHTML = `
        <div class="pc-top">
          <div>
            <div class="pc-name">${escHtml(p.name)}</div>
            ${p.clientName ? `<div class="pc-client">${escHtml(p.clientName)}</div>` : ''}
          </div>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
        ${p.address ? `<div class="pc-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(p.address)}</div>` : ''}
        <div class="pc-footer">
          <div class="pc-stat"><div class="pc-stat-val" data-hours="${p.id}">…</div><div class="pc-stat-lbl">годин</div></div>
          <div class="pc-stat"><div class="pc-stat-val" data-work="${p.id}">…</div><div class="pc-stat-lbl">зароблено</div></div>
          <div class="pc-stat"><div class="pc-stat-val" data-km="${p.id}">…</div><div class="pc-stat-lbl">км</div></div>
        </div>
      `;
      card.addEventListener('click', () => App.Router.navigate(`#/project/${p.id}`));
      list.appendChild(card);
      App.DB.stats.projectSummary(p.id).then(s => {
        const h = list.querySelector(`[data-hours="${p.id}"]`);
        const w = list.querySelector(`[data-work="${p.id}"]`);
        const k = list.querySelector(`[data-km="${p.id}"]`);
        if (h) h.textContent = s.totalHours.toFixed(1);
        if (w) w.textContent = Format.currency(s.totalWorkAmount + s.totalTravelAmount);
        if (k) k.textContent = s.totalKm.toFixed(0);
      });
    });
  }

  function openProjectModal(project, onSave) {
    const isEdit = !!project;
    const backdrop = App.Utils.DOM.openModal(`
      <div class="modal">
        <div class="modal-header">
          <h2>${isEdit ? 'Редагувати проєкт' : 'Новий проєкт'}</h2>
          <button class="modal-close">${svgX()}</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <div class="form-group">
              <label class="form-label">Назва проєкту <span class="required">*</span></label>
              <input class="form-input" name="name" value="${escHtml(project?.name)}" placeholder="Об'єкт Лісова 14">
            </div>
            <div class="form-group">
              <label class="form-label">Клієнт</label>
              <input class="form-input" name="clientName" value="${escHtml(project?.clientName)}" placeholder="Іван Коваленко">
            </div>
            <div class="form-group">
              <label class="form-label">Адреса об'єкту</label>
              <div class="geo-group">
                <input class="form-input" name="address" value="${escHtml(project?.address)}" placeholder="вул. Лісова 14, Київ">
                <button class="btn-geo" id="geo-btn" title="Визначити GPS">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                </button>
              </div>
              <input type="hidden" name="latitude" value="${project?.latitude || ''}">
              <input type="hidden" name="longitude" value="${project?.longitude || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Нотатки</label>
              <textarea class="form-textarea" name="notes" placeholder="Додаткова інформація…">${escHtml(project?.notes)}</textarea>
            </div>
            ${isEdit ? `
              <div class="form-group">
                <label class="form-label">Статус</label>
                <select class="form-select" name="status">
                  <option value="active"${project?.status==='active'?' selected':''}>Активний</option>
                  <option value="completed"${project?.status==='completed'?' selected':''}>Завершено</option>
                  <option value="archived"${project?.status==='archived'?' selected':''}>Архів</option>
                </select>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn-danger btn-sm" id="del-proj-btn">Видалити</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn btn-secondary" id="cancel-proj">Скасувати</button>
          <button class="btn btn-primary" id="save-proj-btn">${isEdit ? 'Зберегти' : 'Створити'}</button>
        </div>
      </div>
    `);

    const modal = backdrop.querySelector('.modal');
    modal.querySelector('#cancel-proj').addEventListener('click', () => App.Utils.DOM.closeModal(backdrop));

    const geoBtn = modal.querySelector('#geo-btn');
    geoBtn.addEventListener('click', async () => {
      geoBtn.disabled = true;
      geoBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px"></div>';
      try {
        const pos = await App.Services.Geo.getAndGeocode();
        modal.querySelector('[name="address"]').value = pos.address;
        modal.querySelector('[name="latitude"]').value = pos.lat;
        modal.querySelector('[name="longitude"]').value = pos.lng;
        App.Utils.DOM.toast('Геолокацію визначено', 'success');
      } catch (e) { App.Utils.DOM.toast(e.message, 'error'); }
      geoBtn.disabled = false;
      geoBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`;
    });

    modal.querySelector('#save-proj-btn').addEventListener('click', async () => {
      const name = modal.querySelector('[name="name"]').value.trim();
      const errors = App.Utils.Validate.form({ name: [App.Utils.Validate.required(name, 'Назва')] });
      App.Utils.Validate.showErrors(modal, errors);
      if (errors) return;
      const data = {
        id: project?.id || App.Utils.Format.uuid(),
        name,
        clientName: modal.querySelector('[name="clientName"]').value.trim(),
        address:    modal.querySelector('[name="address"]').value.trim(),
        latitude:   parseFloat(modal.querySelector('[name="latitude"]').value) || null,
        longitude:  parseFloat(modal.querySelector('[name="longitude"]').value) || null,
        notes:      modal.querySelector('[name="notes"]').value.trim(),
        status: (isEdit ? modal.querySelector('[name="status"]')?.value : undefined) || 'active',
      };
      if (isEdit) await App.DB.projects.update(data.id, data);
      else await App.DB.projects.create(data);
      App.Utils.DOM.closeModal(backdrop);
      App.Utils.DOM.toast(isEdit ? 'Проєкт оновлено' : 'Проєкт створено', 'success');
      App.Store.emit('projects:changed');
      if (onSave) onSave(data);
    });

    if (isEdit) {
      modal.querySelector('#del-proj-btn').addEventListener('click', async () => {
        const ok = await App.Utils.DOM.confirm('Видалити проєкт?', `"${project.name}" та всі пов'язані дані будуть видалені.`);
        if (!ok) return;
        await App.DB.projects.delete(project.id);
        App.Utils.DOM.closeModal(backdrop);
        App.Utils.DOM.toast('Проєкт видалено');
        App.Store.emit('projects:changed');
        App.Router.navigate('#/projects');
      });
    }

    return backdrop;
  }

  function removeFAB() { const f = document.getElementById('main-fab'); if (f) f.remove(); }
  function svgX() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
  function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render, openProjectModal };
})();
