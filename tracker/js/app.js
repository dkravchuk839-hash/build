window.App = window.App || {};

(async () => {
  /* Service Worker */
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./sw.js'); }
    catch (e) { console.warn('SW registration failed:', e); }
  }

  /* Header back button */
  document.querySelector('.back-btn')?.addEventListener('click', () => history.back());

  /* Bottom Nav */
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => App.Router.navigate('#' + item.dataset.route));
  });

  /* Routes */
  App.Router.register('/dashboard',    (p, c) => App.Views.Dashboard.render(p, c));
  App.Router.register('/projects',     (p, c) => App.Views.Projects.render(p, c));
  App.Router.register('/project/:id',  (p, c) => App.Views.ProjectDetail.render(p, c));
  App.Router.register('/report',       (p, c) => App.Views.Report.render(p, c));
  App.Router.register('/settings',     (p, c) => App.Views.Settings.render(p, c));

  /* Init */
  App.Router.init();

  /* Store listeners for cross-view updates */
  App.Store.on('projects:changed', () => {
    const path = App.Router.current?.path;
    if (path === '/projects') App.Router.resolve();
  });
})();
