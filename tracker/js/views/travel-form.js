window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.TravelForm = (() => {
  const { Format, Validate, DOM } = App.Utils;

  async function openModal(record, projectId, onSave) {
    const isEdit = !!record;
    const settings = await App.DB.settings.get();
    const projects = await App.DB.projects.getAll();
    const activeProjects = projects.filter(p => p.status === 'active');

    const today = Format.todayISO();
    const defaultRate = settings.defaultKmRate || 0.25;

    const projOptions = (isEdit ? projects : activeProjects).map(p =>
      `<option value="${p.id}" ${(record?.projectId || projectId) === p.id ? 'selected' : ''}>${escHtml(p.name)}</option>`
    ).join('');

    const backdrop = DOM.openModal(`
      <div class="modal">
        <div class="modal-header">
          <h2>${isEdit ? 'Редагувати поїздку' : 'Нова поїздка'}</h2>
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
              <input class="form-input" type="date" name="date" value="${record?.date || today}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Відстань (км) <span class="required">*</span></label>
                <input class="form-input" type="number" name="kilometers" step="0.1" min="0" value="${record?.kilometers || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Ставка (€/км)</label>
                <input class="form-input" type="number" name="ratePerKm" step="0.01" min="0" value="${record?.ratePerKm ?? defaultRate}">
              </div>
            </div>

            <div class="amount-display" style="background:var(--warning-light);border-color:#fde68a">
              <div>
                <div class="amount-label" style="color:var(--warning)">Відстань</div>
                <div id="km-display">—</div>
              </div>
              <div style="text-align:right">
                <div class="amount-label" style="color:var(--warning)">Сума</div>
                <div class="amount-value" id="travel-amount" style="color:var(--warning)">€0.00</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Звідки</label>
              <input class="form-input" name="fromAddress" value="${escHtml(record?.fromAddress)}" placeholder="Київ, вул. Хрещатик 1">
            </div>
            <div class="form-group">
              <label class="form-label">Куди</label>
              <input class="form-input" name="toAddress" value="${escHtml(record?.toAddress)}" placeholder="Бровари, вул. Лісова 14">
            </div>
            <div class="form-group">
              <label class="form-label">Нотатки</label>
              <textarea class="form-textarea" name="notes" placeholder="Деталі маршруту…">${escHtml(record?.notes)}</textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn-danger btn-sm" id="del-travel-btn">Видалити</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn btn-secondary" id="cancel-travel">Скасувати</button>
          <button class="btn btn-primary" id="save-travel-btn">${isEdit ? 'Зберегти' : 'Додати'}</button>
        </div>
      </div>
    `);

    const modal = backdrop.querySelector('.modal');
    const kmInput   = modal.querySelector('[name="kilometers"]');
    const rateInput = modal.querySelector('[name="ratePerKm"]');
    const kmDisplay = modal.querySelector('#km-display');
    const amtDisplay = modal.querySelector('#travel-amount');

    function updateCalc() {
      const km = parseFloat(kmInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0;
      kmDisplay.textContent = Format.km(km);
      amtDisplay.textContent = Format.currency(km * rate);
    }
    [kmInput, rateInput].forEach(el => el.addEventListener('input', updateCalc));
    updateCalc();

    modal.querySelector('#cancel-travel').addEventListener('click', () => DOM.closeModal(backdrop));

    if (isEdit) {
      modal.querySelector('#del-travel-btn').addEventListener('click', async () => {
        const ok = await DOM.confirm('Видалити поїздку?', 'Ця дія незворотна.');
        if (!ok) return;
        await App.DB.travelRecords.delete(record.id);
        DOM.closeModal(backdrop);
        DOM.toast('Поїздку видалено');
        if (onSave) onSave();
      });
    }

    modal.querySelector('#save-travel-btn').addEventListener('click', async () => {
      const pid        = modal.querySelector('[name="projectId"]').value;
      const date       = modal.querySelector('[name="date"]').value;
      const kilometers = parseFloat(kmInput.value) || 0;
      const ratePerKm  = parseFloat(rateInput.value) || 0;

      const errors = Validate.form({
        projectId:  [Validate.required(pid, 'Проєкт')],
        date:       [Validate.required(date, 'Дата')],
        kilometers: [Validate.number(kmInput.value, 'Відстань', { min: 0.1 })],
      });
      Validate.showErrors(modal, errors);
      if (errors) return;

      const data = {
        id: record?.id || Format.uuid(),
        projectId: pid,
        date,
        kilometers,
        ratePerKm,
        totalAmount: kilometers * ratePerKm,
        fromAddress: modal.querySelector('[name="fromAddress"]').value.trim(),
        toAddress:   modal.querySelector('[name="toAddress"]').value.trim(),
        notes:       modal.querySelector('[name="notes"]').value.trim(),
      };

      if (isEdit) await App.DB.travelRecords.update(data.id, data);
      else await App.DB.travelRecords.create(data);

      DOM.closeModal(backdrop);
      DOM.toast(isEdit ? 'Поїздку оновлено' : 'Поїздку додано', 'success');
      App.Store.emit('travel:changed', { projectId: pid });
      if (onSave) onSave(data);
    });

    return backdrop;
  }

  function svgX() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
  function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { openModal };
})();
