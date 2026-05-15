window.App = window.App || {};
window.App.Views = window.App.Views || {};

App.Views.Dashboard = (() => {
  const { Format, DOM } = App.Utils;

  async function render(params, container) {
    document.querySelector('.app-header h1').textContent = 'Трекер';
    document.querySelector('.back-btn').classList.remove('visible');

    container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    const [summary, recentSessions, activeProjects] = await Promise.all([
      App.DB.stats.monthSummary(),
      App.DB.workSessions.getRecent(10),
      App.DB.projects.getActive(),
    ]);

    const projectMap = {};
    const allProjects = await App.DB.projects.getAll();
    allProjects.forEach(p => { projectMap[p.id] = p; });

    const totalMonth = summary.totalWorkAmount + summary.totalTravelAmount;
    const monthName = new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(new Date());

    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${new Date().getFullYear()}</p>

      <div class="dashboard-stats">
        <div class="stat-card blue">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-value">${Format.duration(summary.totalHours)}</div>
          <div class="stat-label">Відпрацьовано</div>
          <div class="stat-sub">${Format.currency(summary.totalWorkAmount)}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div class="stat-value">${Format.km(summary.totalKm)}</div>
          <div class="stat-label">Кілометраж</div>
          <div class="stat-sub">${Format.currency(summary.totalTravelAmount)}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-value">${Format.currency(totalMonth)}</div>
          <div class="stat-label">Зароблено</div>
          <div class="stat-sub">за місяць</div>
        </div>
      </div>

      ${activeProjects.length > 0 ? `
        <div class="section-header">
          <div class="section-title">Активні проєкти</div>
          <button class="btn btn-ghost btn-sm" id="all-projects-btn">Всі</button>
        </div>
        <div class="projects-scroll" id="projects-scroll"></div>
      ` : ''}

      <div class="section-header" style="margin-top:.5rem">
        <div class="section-title">Останні записи</div>
      </div>
      <div class="card" id="recent-list">
        ${recentSessions.length === 0 ? `
          <div class="empty-state" style="padding:2rem 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h3>Ще немає записів</h3>
            <p>Натисніть "+" щоб додати першу робочу сесію</p>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(view);

    if (activeProjects.length > 0) {
      const scroll = view.querySelector('#projects-scroll');
      activeProjects.slice(0, 6).forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-mini-card';
        card.innerHTML = `
          <div class="pm-name">${escHtml(p.name)}</div>
          <div class="pm-address">${escHtml(p.address || 'Адреса не вказана')}</div>
          <div class="pm-stats">
            <div><div class="pm-stat-val">${p._hours || '—'}</div><div class="pm-stat-lbl">год</div></div>
          </div>
        `;
        card.addEventListener('click', () => App.Router.navigate(`#/project/${p.id}`));
        scroll.appendChild(card);
      });
      const allBtn = view.querySelector('#all-projects-btn');
      if (allBtn) allBtn.addEventListener('click', () => App.Router.navigate('#/projects'));
    }

    const recentList = view.querySelector('#recent-list');
    if (recentSessions.length > 0) {
      recentSessions.forEach(s => {
        const proj = projectMap[s.projectId];
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="li-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="li-body">
            <div class="li-title">${escHtml(proj ? proj.name : 'Невідомий проєкт')}</div>
            <div class="li-sub">${Format.date(s.date)} · ${Format.duration(s.durationHours)}${s.description ? ' · ' + escHtml(s.description).slice(0, 30) : ''}</div>
          </div>
          <div class="li-right">
            <div class="li-amount">${Format.currency(s.totalAmount)}</div>
          </div>
        `;
        item.addEventListener('click', () => { if (proj) App.Router.navigate(`#/project/${proj.id}`); });
        recentList.appendChild(item);
      });
    }

    renderFAB();
  }

  function renderFAB() {
    let fab = document.getElementById('main-fab');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'main-fab';
      fab.className = 'fab';
      fab.title = 'Новий запис';
      fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      document.body.appendChild(fab);
    }
    fab.onclick = () => App.Views.SessionForm.openModal(null, null, () => App.Router.resolve());
  }

  function escHtml(str) { return (str || '').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { render };
})();
