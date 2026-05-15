window.App = window.App || {};
window.App.Services = window.App.Services || {};

App.Services.Export = (() => {
  async function exportJSON() {
    const [projects, sessions, travel, photos, settings] = await Promise.all([
      App.DB.projects.getAll(),
      App.DB.workSessions.getAll(),
      App.DB.travelRecords.getAll(),
      App.DB.photos.getAll(),
      App.DB.settings.get(),
    ]);
    const data = { version: 1, exportedAt: new Date().toISOString(), projects, sessions, travel, photos, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `tracker-backup-${App.Utils.Format.todayISO()}.json`);
  }

  async function importJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.version || !data.projects) throw new Error('Невірний формат файлу');
    const db = App.DB;
    await Promise.all([
      ...data.projects.map(p => db.projects.create(p)),
      ...(data.sessions || []).map(s => db.workSessions.create(s)),
      ...(data.travel || []).map(t => db.travelRecords.create(t)),
      ...(data.photos || []).map(ph => db.photos.create(ph)),
    ]);
    if (data.settings) await db.settings.save(data.settings);
    return data;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
  }

  return { exportJSON, importJSON, downloadBlob };
})();
