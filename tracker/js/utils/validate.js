window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

App.Utils.Validate = (() => {
  function required(val, label) {
    if (!val || !String(val).trim()) return `${label} є обов'язковим`;
    return null;
  }

  function number(val, label, { min = 0, max = Infinity } = {}) {
    const n = parseFloat(val);
    if (isNaN(n)) return `${label} має бути числом`;
    if (n < min) return `${label} не може бути менше ${min}`;
    if (n > max) return `${label} не може бути більше ${max}`;
    return null;
  }

  function time(val) {
    if (!val) return 'Час є обов\'язковим';
    if (!/^\d{2}:\d{2}$/.test(val)) return 'Невірний формат часу';
    return null;
  }

  function form(rules) {
    const errors = {};
    for (const [field, errs] of Object.entries(rules)) {
      const msg = errs.find(Boolean);
      if (msg) errors[field] = msg;
    }
    return Object.keys(errors).length ? errors : null;
  }

  function showErrors(container, errors) {
    container.querySelectorAll('.form-error').forEach(el => el.remove());
    container.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error').forEach(el => el.classList.remove('error'));
    if (!errors) return;
    for (const [field, msg] of Object.entries(errors)) {
      const input = container.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add('error');
        const err = document.createElement('div');
        err.className = 'form-error';
        err.textContent = msg;
        input.parentNode.insertBefore(err, input.nextSibling);
      }
    }
  }

  return { required, number, time, form, showErrors };
})();
