window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.ProjectDetail = (() => {
  const { Format, DOM } = App.Utils;

  async function render({ id: projectId }, container) {
    const project = await App.DB.projects.getById(projectId);
    if (!project) { App.Router.navigate('#/projects'); return; }

    document.querySelector('.app-header h1').textContent = project.name;
    const backBtn = document.querySelector('.back-btn');
    backBtn.classList.add('visible');
    backBtn.onclick = () => App.Router.navigate('#/projects');

    const [summary, sessions, travel, photos] = await Promise.all([
      App.DB.stats.projectSummary(projectId),
      App.DB.workSessions.getByProject(projectId),
      App.DB.travelRecords.getByProject(projectId),
      App.DB.photos.getByProject(projectId),
    ]);
    sessions.sort((a, b) => b.date.localeCompare(a.date));
    travel.sort((a, b) => b.date.localeCompare(a.date));

    const grandTotal = summary.totalWorkAmount + summary.totalTravelAmount;
    const statusLabel = { active: 'Активний', completed: 'Завершено', archived: 'Архів' }[project.status] || '';
    const statusClass = { active: 'badge-active', completed: 'badge-completed', archived: 'badge-archived' }[project.status] || '';
    const mapsHref = (project.latitude && project.longitude) ? App.Services.Geo.mapsLink(project.latitude, project.longitude) : null;

    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <div class="project-detail-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h2>${escHtml(project.name)}</h2>
            ${project.clientName ? `<div class="pdh-client">${escHtml(project.clientName)}</div>` : ''}
            ${project.address ? `<div class="pdh-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(project.address)}</div>` : ''}
          </div>
          <div style="display:flex;gap:.5rem;flex-direction:column;align-items:flex-end">
            <span class="badge ${statusClass}">${statusLabel}</span>
            <button class="btn btn-secondary btn-sm" id="edit-project-btn" style="color:var(--text)">Редагувати</button>
          </div>
        </div>
        ${mapsHref ? `<div style="margin-top:.75rem"><a class="map-link" href="${mapsHref}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>Відкрити на карті</a></div>` : ''}
      </div>

      <div class="detail-stats">
        <div class="detail-stat"><div class="ds-val">${summary.totalHours.toFixed(1)}</div><div class="ds-lbl">год</div></div>
        <div class="detail-stat"><div class="ds-val">${summary.totalKm.toFixed(0)}</div><div class="ds-lbl">км</div></div>
        <div class="detail-stat"><div class="ds-val" style="color:var(--success)">${Format.currency(grandTotal)}</div><div class="ds-lbl">разом</div></div>
      </div>

      <div class="tabs" id="proj-tabs">
        <button class="tab active" data-tab="sessions">Сесії (${sessions.length})</button>
        <button class="tab" data-tab="travel">Поїздки (${travel.length})</button>
        <button class="tab" data-tab="photos">Фото (${photos.length})</button>
        <button class="tab" data-tab="overview">Огляд</button>
        <button class="tab" data-tab="report">Звіт</button>
      </div>

      <div id="tab-sessions" class="tab-panel active"></div>
      <div id="tab-travel"   class="tab-panel"></div>
      <div id="tab-photos"   class="tab-panel"></div>
      <div id="tab-overview" class="tab-panel"></div>
      <div id="tab-report"   class="tab-panel"></div>
    `;

    container.innerHTML = '';
    container.appendChild(view);

    view.querySelector('#edit-project-btn').addEventListener('click', () => {
      App.Views.Projects.openProjectModal(project, async updated => {
        if (updated) App.Router.resolve();
      });
    });

    /* Tab switching */
    view.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        view.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        view.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        view.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
      });
    });

    renderSessions(sessions, view, projectId);
    renderTravel(travel, view, projectId);
    renderPhotos(photos, view, projectId);
    renderOverview(project, summary, grandTotal, view);
    renderReport(project, view);

    /* FAB */
    renderFAB(projectId);
  }

  function renderSessions(sessions, view, projectId) {
    const panel = view.querySelector('#tab-sessions');
    panel.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-bottom:.75rem"><button class="btn btn-primary btn-sm" id="add-session-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Додати сесію</button></div>`;

    panel.querySelector('#add-session-btn').addEventListener('click', () => {
      App.Views.SessionForm.openModal(null, projectId, () => App.Router.resolve());
    });

    if (sessions.length === 0) {
      panel.innerHTML += emptyState('clock', 'Немає сесій', 'Натисніть "Додати сесію" щоб розпочати трекінг');
      return;
    }

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item';
      item.innerHTML = `
        <div class="si-top">
          <span class="si-date">${Format.date(s.date)} · ${s.startTime || ''}${s.endTime ? ' – ' + s.endTime : ''}</span>
          <span class="si-amount">${Format.currency(s.totalAmount)}</span>
        </div>
        ${s.description ? `<div class="si-desc">${escHtml(s.description)}</div>` : ''}
        <div class="si-meta">
          <span class="si-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${Format.duration(s.durationHours)}</span>
          <span class="si-tag">€${(s.hourlyRate||0).toFixed(2)}/год</span>
          ${s.locationName ? `<span class="si-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(s.locationName).slice(0, 30)}</span>` : ''}
          ${s.photoIds?.length ? `<span class="si-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>${s.photoIds.length} фото</span>` : ''}
        </div>
        <div class="si-actions">
          <button class="btn btn-secondary btn-sm edit-session" data-id="${s.id}">Редагувати</button>
        </div>
      `;
      item.querySelector('.edit-session').addEventListener('click', () => {
        App.Views.SessionForm.openModal(s, null, () => App.Router.resolve());
      });
      panel.appendChild(item);
    });
  }

  function renderTravel(travel, view, projectId) {
    const panel = view.querySelector('#tab-travel');
    panel.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-bottom:.75rem"><button class="btn btn-primary btn-sm" id="add-travel-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Додати поїздку</button></div>`;

    panel.querySelector('#add-travel-btn').addEventListener('click', () => {
      App.Views.TravelForm.openModal(null, projectId, () => App.Router.resolve());
    });

    if (travel.length === 0) {
      panel.innerHTML += emptyState('car', 'Немає поїздок', 'Натисніть "Додати поїздку" щоб записати кілометраж');
      return;
    }

    travel.forEach(t => {
      const item = document.createElement('div');
      item.className = 'travel-item';
      item.innerHTML = `
        <div class="ti-top">
          <span class="ti-date">${Format.date(t.date)}</span>
          <span class="ti-amount">${Format.currency(t.totalAmount)}</span>
        </div>
        <div class="ti-route">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          ${t.fromAddress ? escHtml(t.fromAddress) + (t.toAddress ? ' → ' + escHtml(t.toAddress) : '') : '—'}
        </div>
        <div class="ti-meta">${Format.km(t.kilometers)} · €${(t.ratePerKm||0).toFixed(2)}/км${t.notes ? ' · ' + escHtml(t.notes).slice(0, 40) : ''}</div>
        <div class="ti-actions">
          <button class="btn btn-secondary btn-sm edit-travel" data-id="${t.id}">Редагувати</button>
        </div>
      `;
      item.querySelector('.edit-travel').addEventListener('click', () => {
        App.Views.TravelForm.openModal(t, null, () => App.Router.resolve());
      });
      panel.appendChild(item);
    });
  }

  function renderPhotos(photos, view, projectId) {
    const panel = view.querySelector('#tab-photos');
    if (photos.length === 0) {
      panel.innerHTML = emptyState('camera', 'Немає фото', 'Фото можна прикріпити при додаванні робочої сесії');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'photo-grid';
    photos.forEach(photo => {
      const thumb = App.Services.Photos.thumbEl(photo, () => App.Router.resolve());
      grid.appendChild(thumb);
    });
    panel.appendChild(grid);
  }

  function renderOverview(project, summary, grandTotal, view) {
    const panel = view.querySelector('#tab-overview');
    panel.innerHTML = `
      <div class="summary-box" style="margin-bottom:1rem">
        <div class="summary-row"><span class="summary-label">Відпрацьовано годин</span><strong>${Format.duration(summary.totalHours)}</strong></div>
        <div class="summary-row"><span class="summary-label">Сума за роботу</span><strong>${Format.currency(summary.totalWorkAmount)}</strong></div>
        <div class="summary-row"><span class="summary-label">Кілометраж</span><strong>${Format.km(summary.totalKm)}</strong></div>
        <div class="summary-row"><span class="summary-label">Сума за дорогу</span><strong>${Format.currency(summary.totalTravelAmount)}</strong></div>
        <div class="summary-row"><span>РАЗОМ ДО ОПЛАТИ</span><strong style="color:var(--primary)">${Format.currency(grandTotal)}</strong></div>
      </div>
      ${project.notes ? `<div class="card"><h4 style="margin-bottom:.5rem">Нотатки</h4><p style="font-size:.875rem;color:var(--text-2)">${escHtml(project.notes)}</p></div>` : ''}
    `;
  }

  function renderReport(project, view) {
    const panel = view.querySelector('#tab-report');
    const { Format: F } = App.Utils;
    const range = F.monthRange();
    panel.innerHTML = `
      <div class="report-controls">
        <h3 style="margin-bottom:.75rem">Генерувати PDF звіт</h3>
        <div class="form-row" style="margin-bottom:.75rem">
          <div class="form-group">
            <label class="form-label">Від</label>
            <input class="form-input" type="date" id="report-from" value="${range.from}">
          </div>
          <div class="form-group">
            <label class="form-label">До</label>
            <input class="form-input" type="date" id="report-to" value="${range.to}">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:.75rem">
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
            <input type="checkbox" id="include-photos" checked style="width:18px;height:18px;cursor:pointer">
            <span class="form-label" style="margin:0">Включити фото у звіт</span>
          </label>
        </div>
        <button class="btn btn-primary btn-full" id="generate-pdf-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Завантажити PDF
        </button>
      </div>
      <p style="font-size:.8rem;color:var(--text-muted);text-align:center">PDF містить таблиці робочих сесій, кілометражу, підсумки та фото</p>
    `;

    panel.querySelector('#generate-pdf-btn').addEventListener('click', async () => {
      const from = panel.querySelector('#report-from').value;
      const to   = panel.querySelector('#report-to').value;
      const includePhotos = panel.querySelector('#include-photos').checked;
      const btn = panel.querySelector('#generate-pdf-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></div> Генеруємо…';
      try {
        const filename = await App.Services.PDF.generate(project.id, { from, to, includePhotos });
        App.Utils.DOM.toast('Звіт завантажено: ' + filename, 'success');
      } catch (e) {
        App.Utils.DOM.toast('Помилка: ' + e.message, 'error');
      }
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Завантажити PDF`;
    });
  }

  function renderFAB(projectId) {
    let fab = document.getElementById('main-fab');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'main-fab';
      fab.className = 'fab';
      document.body.appendChild(fab);
    }
    fab.title = 'Новий запис';
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    fab.onclick = () => {
      const activeTab = document.querySelector('.tab.active')?.dataset?.tab;
      if (activeTab === 'travel') App.Views.TravelForm.openModal(null, projectId, () => App.Router.resolve());
      else App.Views.SessionForm.openModal(null, projectId, () => App.Router.resolve());
    };
  }

  function emptyState(iconName, title, desc) {
    const icons = {
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      car: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
      camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    };
    return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">${icons[iconName]||''}</svg><h3>${title}</h3><p>${desc}</p></div>`;
  }

  function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
