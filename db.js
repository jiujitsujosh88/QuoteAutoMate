/* db.js — Quote AutoMate IndexedDB wrapper (Step E)
   Stores: quotes, customers, vehicles, presets, settings
   API (global): window.QAMDB = { init, put, get, getAll, del, clear, counts }
*/

(() => {
  const DB_NAME = 'QAM_DB';
  const DB_VERSION = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        // Create stores if not exist
        if (!db.objectStoreNames.contains('quotes')) {
          db.createObjectStore('quotes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('presets')) {
          db.createObjectStore('presets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const out = fn(store);
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  const api = {
    async init() {
      await openDB();
      return true;
    },
    async put(store, value) {
      return withStore(store, 'readwrite', (s) => s.put(value));
    },
    async get(store, key) {
      return withStore(store, 'readonly', (s) => {
        return new Promise((res, rej) => {
          const req = s.get(key);
          req.onsuccess = () => res(req.result || null);
          req.onerror = () => rej(req.error);
        });
      });
    },
    async getAll(store) {
      return withStore(store, 'readonly', (s) => {
        return new Promise((res, rej) => {
          const req = s.getAll();
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => rej(req.error);
        });
      });
    },
    async del(store, key) {
      return withStore(store, 'readwrite', (s) => s.delete(key));
    },
    async clear(store) {
      return withStore(store, 'readwrite', (s) => s.clear());
    },
    async counts() {
      // Return counts for quick diagnostics
      const stores = ['quotes', 'customers', 'vehicles', 'presets', 'settings'];
      const db = await openDB();
      const results = {};
      await Promise.all(stores.map((name) => new Promise((resolve) => {
        const tx = db.transaction(name, 'readonly');
        const s = tx.objectStore(name);
        const req = s.count();
        req.onsuccess = () => { results[name] = req.result || 0; resolve(); };
        req.onerror = () => { results[name] = 0; resolve(); };
      })));
      return results;
    }
  };

  window.QAMDB = api;
})();