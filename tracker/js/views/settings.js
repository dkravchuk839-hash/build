window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.Settings = (() => {
  async function render(params, container) {
    const settings = await App.DB.settings.get();
    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <h1 style="margin-bottom:1.25rem">Налаштування</h1>

      <div class="settings-section">
        <div class="settings-section-title">Виконавець</div>
        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">Ім'я та прізвище</label>
            <input class="form-input" name="workerName" value="${escHtml(settings.workerName)}" placeholder="Іван Коваленко">
          </div>
          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input class="form-input" name="workerPhone" value="${escHtml(settings.workerPhone)}" placeholder="+380 99 123 45 67">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Ставки за замовчуванням</div>
        <div class="settings-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Погодинна ставка (€/год)</label>
              <input class="form-input" name="defaultHourlyRate" type="number" step="0.5" min="0" value="${settings.defaultHourlyRate}">
            </div>
            <div class="form-group">
              <label class="form-label">Ставка за км (€/км)</label>
              <input class="form-input" name="defaultKmRate" type="number" step="0.01" min="0" value="${settings.defaultKmRate}">
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="save-settings" style="margin-bottom:1.5rem">Зберегти налаштування</button>

      <div class="settings-section">
        <div class="settings-section-title">Дані</div>
        <div class="settings-form">
          <button class="btn btn-secondary" id="export-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Резервна копія (JSON)
          </button>
          <div>
            <label class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:.5rem;cursor:pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Відновити з копії
              <input type="file" accept=".json" id="import-file" style="display:none">
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section" style="margin-top:2rem">
        <div class="settings-section-title" style="color:var(--danger)">Небезпечна зона</div>
        <div class="settings-form">
          <button class="btn btn-danger" id="clear-btn">Очистити всі дані</button>
        </div>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(view);
    document.querySelector('.app-header h1').textContent = 'Налаштування';
    document.querySelector('.back-btn').classList.remove('visible');

    view.querySelector('#save-settings').addEventListener('click', async () => {
      const data = {
        workerName:       view.querySelector('[name="workerName"]').value.trim(),
        workerPhone:      view.querySelector('[name="workerPhone"]').value.trim(),
        defaultHourlyRate: parseFloat(view.querySelector('[name="defaultHourlyRate"]').value) || 0,
        defaultKmRate:    parseFloat(view.querySelector('[name="defaultKmRate"]').value) || 0,
        currency: 'EUR',
      };
      await App.DB.settings.save(data);
      App.Utils.DOM.toast('Налаштування збережено', 'success');
    });

    view.querySelector('#export-btn').addEventListener('click', async () => {
      try { await App.Services.Export.exportJSON(); App.Utils.DOM.toast('Резервну копію збережено'); }
      catch (e) { App.Utils.DOM.toast('Помилка: ' + e.message, 'error'); }
    });

    view.querySelector('#import-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await App.Services.Export.importJSON(file);
        App.Utils.DOM.toast('Дані відновлено. Оновіть сторінку.', 'success');
      } catch (err) { App.Utils.DOM.toast('Помилка: ' + err.message, 'error'); }
    });

    view.querySelector('#clear-btn').addEventListener('click', async () => {
      const ok = await App.Utils.DOM.confirm('Очистити всі дані?', 'Цю дію неможливо скасувати. Всі проєкти, сесії та фото будуть видалені.');
      if (!ok) return;
      const req = indexedDB.deleteDatabase('tracker-db');
      req.onsuccess = () => { App.Utils.DOM.toast('Всі дані видалено'); location.reload(); };
    });
  }

  function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }

  return { render };
})();
