window.App = window.App || {};

App.DB = (() => {
  const DB_NAME = 'tracker-db';
  const DB_VER  = 1;
  let _db = null;

  async function open() {
    if (_db) return _db;
    _db = await idb.openDB(DB_NAME, DB_VER, {
      upgrade(db) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('status',    'status');
        projects.createIndex('createdAt', 'createdAt');

        const sessions = db.createObjectStore('workSessions', { keyPath: 'id' });
        sessions.createIndex('projectId', 'projectId');
        sessions.createIndex('date',      'date');

        const travel = db.createObjectStore('travelRecords', { keyPath: 'id' });
        travel.createIndex('projectId', 'projectId');
        travel.createIndex('date',      'date');

        const photos = db.createObjectStore('photos', { keyPath: 'id' });
        photos.createIndex('projectId', 'projectId');
        photos.createIndex('sessionId', 'sessionId');

        db.createObjectStore('settings', { keyPath: 'id' });
      }
    });
    return _db;
  }

  /* ── Generic helpers ── */
  async function getAll(store) {
    const db = await open();
    return db.getAll(store);
  }
  async function getById(store, id) {
    const db = await open();
    return db.get(store, id);
  }
  async function put(store, item) {
    const db = await open();
    return db.put(store, item);
  }
  async function remove(store, id) {
    const db = await open();
    return db.delete(store, id);
  }
  async function getAllByIndex(store, index, value) {
    const db = await open();
    return db.getAllFromIndex(store, index, value);
  }

  /* ── Projects ── */
  const projects = {
    getAll: () => getAll('projects'),
    getById: id => getById('projects', id),
    async getActive() {
      const db = await open();
      return db.getAllFromIndex('projects', 'status', 'active');
    },
    async create(data) {
      const now = new Date().toISOString();
      const item = { ...data, createdAt: now, updatedAt: now };
      await put('projects', item);
      return item;
    },
    async update(id, data) {
      const existing = await getById('projects', id);
      if (!existing) throw new Error('Project not found');
      const item = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
      await put('projects', item);
      return item;
    },
    delete: id => remove('projects', id),
  };

  /* ── Work Sessions ── */
  const workSessions = {
    getAll: () => getAll('workSessions'),
    getById: id => getById('workSessions', id),
    getByProject: projectId => getAllByIndex('workSessions', 'projectId', projectId),
    async getByProjectAndRange(projectId, from, to) {
      const all = await getAllByIndex('workSessions', 'projectId', projectId);
      return all.filter(s => s.date >= from && s.date <= to);
    },
    async getRecent(limit = 10) {
      const all = await getAll('workSessions');
      return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },
    async create(data) {
      const item = { ...data, createdAt: new Date().toISOString() };
      await put('workSessions', item);
      return item;
    },
    async update(id, data) {
      const existing = await getById('workSessions', id);
      if (!existing) throw new Error('Session not found');
      const item = { ...existing, ...data, id };
      await put('workSessions', item);
      return item;
    },
    delete: id => remove('workSessions', id),
  };

  /* ── Travel Records ── */
  const travelRecords = {
    getAll: () => getAll('travelRecords'),
    getById: id => getById('travelRecords', id),
    getByProject: projectId => getAllByIndex('travelRecords', 'projectId', projectId),
    async getByProjectAndRange(projectId, from, to) {
      const all = await getAllByIndex('travelRecords', 'projectId', projectId);
      return all.filter(r => r.date >= from && r.date <= to);
    },
    async create(data) {
      const item = { ...data, createdAt: new Date().toISOString() };
      await put('travelRecords', item);
      return item;
    },
    async update(id, data) {
      const existing = await getById('travelRecords', id);
      if (!existing) throw new Error('Record not found');
      const item = { ...existing, ...data, id };
      await put('travelRecords', item);
      return item;
    },
    delete: id => remove('travelRecords', id),
  };

  /* ── Photos ── */
  const photos = {
    getAll: () => getAll('photos'),
    getById: id => getById('photos', id),
    getByProject: projectId => getAllByIndex('photos', 'projectId', projectId),
    getBySession: sessionId => getAllByIndex('photos', 'sessionId', sessionId),
    async create(data) {
      const item = { ...data, takenAt: new Date().toISOString() };
      await put('photos', item);
      return item;
    },
    delete: id => remove('photos', id),
  };

  /* ── Settings ── */
  const settings = {
    async get() {
      const s = await getById('settings', 'user_settings');
      return s || {
        id: 'user_settings',
        workerName: '',
        workerPhone: '',
        defaultHourlyRate: 15,
        defaultKmRate: 0.25,
        currency: 'EUR',
      };
    },
    async save(data) {
      const item = { id: 'user_settings', ...data };
      await put('settings', item);
      return item;
    },
  };

  /* ── Aggregations ── */
  const stats = {
    async monthSummary() {
      const { from, to } = App.Utils.Format.monthRange();
      const sessions = await getAll('workSessions');
      const travel = await getAll('travelRecords');
      const monthSessions = sessions.filter(s => s.date >= from && s.date <= to);
      const monthTravel = travel.filter(t => t.date >= from && t.date <= to);
      return {
        totalHours: monthSessions.reduce((s, r) => s + (r.durationHours || 0), 0),
        totalWorkAmount: monthSessions.reduce((s, r) => s + (r.totalAmount || 0), 0),
        totalKm: monthTravel.reduce((s, r) => s + (r.kilometers || 0), 0),
        totalTravelAmount: monthTravel.reduce((s, r) => s + (r.totalAmount || 0), 0),
      };
    },
    async projectSummary(projectId) {
      const [sessions, travel, projPhotos] = await Promise.all([
        workSessions.getByProject(projectId),
        travelRecords.getByProject(projectId),
        photos.getByProject(projectId),
      ]);
      return {
        totalHours: sessions.reduce((s, r) => s + (r.durationHours || 0), 0),
        totalWorkAmount: sessions.reduce((s, r) => s + (r.totalAmount || 0), 0),
        totalKm: travel.reduce((s, r) => s + (r.kilometers || 0), 0),
        totalTravelAmount: travel.reduce((s, r) => s + (r.totalAmount || 0), 0),
        sessionCount: sessions.length,
        travelCount: travel.length,
        photoCount: projPhotos.length,
      };
    },
  };

  return { projects, workSessions, travelRecords, photos, settings, stats };
})();
