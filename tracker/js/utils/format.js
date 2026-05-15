window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

App.Utils.Format = (() => {
  const currencyFmt = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
  const dateFmt = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateLongFmt = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  function currency(amount) {
    if (amount == null || isNaN(amount)) return '€0.00';
    return currencyFmt.format(amount);
  }

  function date(isoDate) {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
  }

  function dateLong(isoDate) {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return dateLongFmt.format(new Date(+y, +m - 1, +d));
  }

  function duration(hours) {
    if (hours == null || isNaN(hours)) return '0 год';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h} год`;
    return `${h} год ${m} хв`;
  }

  function km(val) {
    if (val == null) return '0 км';
    return `${(+val).toFixed(1)} км`;
  }

  function hours(val) {
    if (val == null) return '0 год';
    return `${(+val).toFixed(2)} год`;
  }

  function timeToDecimal(hhmm) {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
  }

  function calcDuration(start, end) {
    let diff = timeToDecimal(end) - timeToDecimal(start);
    if (diff < 0) diff += 24;
    return Math.round(diff * 100) / 100;
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function monthRange() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const pad = v => String(v).padStart(2, '0');
    const lastDay = new Date(y, m, 0).getDate();
    return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${lastDay}` };
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  return { currency, date, dateLong, duration, km, hours, timeToDecimal, calcDuration, todayISO, monthRange, uuid };
})();
