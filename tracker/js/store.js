window.App = window.App || {};

App.Store = (() => {
  const listeners = {};

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => { listeners[event] = listeners[event].filter(l => l !== cb); };
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(cb => cb(data));
    (listeners['*'] || []).forEach(cb => cb({ event, data }));
  }

  return { on, emit };
})();
