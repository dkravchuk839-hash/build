window.App = window.App || {};

App.Router = (() => {
  const routes = {};
  let currentRoute = null;

  function register(pattern, handler) {
    routes[pattern] = { handler, re: new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$') };
  }

  function navigate(hash) {
    if (!hash.startsWith('#/')) hash = '#/dashboard';
    window.location.hash = hash;
  }

  function matchRoute(path) {
    for (const [pattern, { handler, re }] of Object.entries(routes)) {
      const keys = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
      const match = path.match(re);
      if (match) {
        const params = {};
        keys.forEach((k, i) => { params[k] = match[i + 1]; });
        return { handler, params };
      }
    }
    return null;
  }

  function resolve() {
    const hash = window.location.hash || '#/dashboard';
    const path = hash.slice(1) || '/dashboard';
    const match = matchRoute(path);
    if (!match) { navigate('#/dashboard'); return; }
    currentRoute = { path, params: match.params };
    const container = document.getElementById('view-container');
    if (container) container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
    match.handler(match.params, container);
    updateNav(path);
  }

  function updateNav(path) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const target = item.dataset.route;
      item.classList.toggle('active', target && path.startsWith(target));
    });
  }

  function init() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { register, navigate, init, resolve, get current() { return currentRoute; } };
})();
