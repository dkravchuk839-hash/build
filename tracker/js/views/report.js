window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.Report = (() => {
  async function render(params, container) {
    document.querySelector('.app-header h1').textContent = 'Звіти';
    document.querySelector('.back-btn').classList.remove('visible');
    const fab = document.getElementById('main-fab');
    if (fab) fab.remove();

    const projects = await App.DB.projects.getAll();
    const active = projects.filter(p => p.status === 'active');

    const view = document.createElement('div');
    view.className = 'view';

    if (projects.length === 0) {
      view.innerHTML = `
        <div class="empty-state" style="margin-top:3rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h3>Немає проєктів</h3>
          <p>Спочатку створіть проєкт та додайте робочі сесії</p>
          <button class="btn btn-primary" onclick="App.Router.navigate('#/projects')">Перейти до проєктів</button>
        </div>
      `;
      container.innerHTML = '';
      container.appendChild(view);
      return;
    }

    const range = App.Utils.Format.monthRange();
    const projOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    view.innerHTML = `
      <h1 style="margin-bottom:1rem">PDF Звіт</h1>
      <div class="report-controls">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Проєкт <span class="required">*</span></label>
            <select class="form-select" id="report-project">${projOptions}</select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Від</label>
              <input class="form-input" type="date" id="report-from" value="${range.from}">
            </div>
            <div class="form-group">
              <label class="form-label">До</label>
              <input class="form-input" type="date" id="report-to" value="${range.to}">
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
            <input type="checkbox" id="include-photos" checked style="width:18px;height:18px">
            <span class="form-label" style="margin:0">Включити фото</span>
          </label>
        </div>
      </div>

      <div class="report-preview" id="preview-area">
        <p style="color:var(--text-muted);font-size:.875rem;text-align:center">Оберіть проєкт і натисніть "Попередній перегляд"</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:.75rem">
        <button class="btn btn-secondary btn-full" id="preview-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Попередній перегляд
        </button>
        <button class="btn btn-primary btn-full" id="download-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Завантажити PDF
        </button>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(view);

    async function getReportData() {
      const projectId = view.querySelector('#report-project').value;
      const from = view.querySelector('#report-from').value;
      const to = view.querySelector('#report-to').value;
      const [sessions, travel] = await Promise.all([
        from && to ? App.DB.workSessions.getByProjectAndRange(projectId, from, to) : App.DB.workSessions.getByProject(projectId),
        from && to ? App.DB.travelRecords.getByProjectAndRange(projectId, from, to) : App.DB.travelRecords.getByProject(projectId),
      ]);
      return { projectId, from, to, sessions, travel };
    }

    view.querySelector('#preview-btn').addEventListener('click', async () => {
      const { sessions, travel } = await getReportData();
      const { Format: F } = App.Utils;
      const preview = view.querySelector('#preview-area');

      const totalHours  = sessions.reduce((s, r) => s + (r.durationHours || 0), 0);
      const totalWork   = sessions.reduce((s, r) => s + (r.totalAmount || 0), 0);
      const totalKm     = travel.reduce((s, r) => s + (r.kilometers || 0), 0);
      const totalTravel = travel.reduce((s, r) => s + (r.totalAmount || 0), 0);

      const sessionsHTML = sessions.length === 0 ? '<p style="color:var(--text-muted);font-size:.8rem">Немає сесій за цей період</p>' : `
        <table class="report-table">
          <thead><tr><th>№</th><th>Дата</th><th>Опис</th><th>Год</th><th>Ставка</th><th class="td-right">Сума</th></tr></thead>
          <tbody>${sessions.map((s, i) => `<tr><td>${i+1}</td><td>${F.date(s.date)}</td><td>${escHtml(s.description||'—')}</td><td>${(s.durationHours||0).toFixed(2)}</td><td>€${(s.hourlyRate||0).toFixed(2)}</td><td class="td-right">${F.currency(s.totalAmount)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="3">Разом</td><td>${totalHours.toFixed(2)}</td><td></td><td class="td-right">${F.currency(totalWork)}</td></tr></tfoot>
        </table>`;

      const travelHTML = travel.length === 0 ? '' : `
        <h4 style="margin:.875rem 0 .5rem">Кілометраж</h4>
        <table class="report-table">
          <thead><tr><th>№</th><th>Дата</th><th>Маршрут</th><th>КМ</th><th>Ставка</th><th class="td-right">Сума</th></tr></thead>
          <tbody>${travel.map((t, i) => `<tr><td>${i+1}</td><td>${F.date(t.date)}</td><td>${escHtml([t.fromAddress,t.toAddress].filter(Boolean).join('→')||'—')}</td><td>${(t.kilometers||0).toFixed(1)}</td><td>€${(t.ratePerKm||0).toFixed(2)}</td><td class="td-right">${F.currency(t.totalAmount)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="3">Разом</td><td>${totalKm.toFixed(1)}</td><td></td><td class="td-right">${F.currency(totalTravel)}</td></tr></tfoot>
        </table>`;

      preview.innerHTML = `
        <h4 style="margin-bottom:.75rem">Попередній перегляд</h4>
        ${sessionsHTML}${travelHTML}
        <div class="summary-box" style="margin-top:.875rem">
          <div class="summary-row"><span class="summary-label">Разом годин</span><span>${F.duration(totalHours)}</span></div>
          <div class="summary-row"><span class="summary-label">За роботу</span><span>${F.currency(totalWork)}</span></div>
          <div class="summary-row"><span class="summary-label">Разом км</span><span>${F.km(totalKm)}</span></div>
          <div class="summary-row"><span class="summary-label">За дорогу</span><span>${F.currency(totalTravel)}</span></div>
          <div class="summary-row"><span>РАЗОМ</span><span>${F.currency(totalWork+totalTravel)}</span></div>
        </div>
      `;
    });

    view.querySelector('#download-btn').addEventListener('click', async () => {
      const { projectId, from, to } = await getReportData();
      const includePhotos = view.querySelector('#include-photos').checked;
      const btn = view.querySelector('#download-btn');
      btn.disabled = true;
      btn.textContent = 'Генеруємо…';
      try {
        await App.Services.PDF.generate(projectId, { from, to, includePhotos });
        App.Utils.DOM.toast('PDF завантажено', 'success');
      } catch (e) { App.Utils.DOM.toast('Помилка: ' + e.message, 'error'); }
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Завантажити PDF`;
    });
  }

  function escHtml(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { render };
})();
