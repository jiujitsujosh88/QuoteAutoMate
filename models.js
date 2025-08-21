// models.js  — Quote AutoMate core data models + local DB + events
(() => {
  const VERSION = 'b.0.1';

  // -----------------------------
  // Small utilities
  // -----------------------------
  const uid = (p='id') =>
    `${p}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

  const todayISO = () => new Date().toISOString();

  // -----------------------------
  // Event bus (pub/sub)
  // -----------------------------
  const Events = {
    _map: new Map(),
    on(evt, fn){ if(!this._map.has(evt)) this._map.set(evt, new Set()); this._map.get(evt).add(fn); return () => this.off(evt, fn); },
    off(evt, fn){ this._map.get(evt)?.delete(fn); },
    emit(evt, payload){ this._map.get(evt)?.forEach(fn => { try { fn(payload); } catch(_){} }); }
  };

  // -----------------------------
  // LocalDB (localStorage wrapper)
  // -----------------------------
  const KEY = 'QAM_DB';
  const defaultDB = () => ({
    _v: VERSION,
    quotes: [],     // Quote[]
    customers: [],  // Customer[]
    vehicles: [],   // Vehicle[]
    presets: []     // Preset[]
  });

  const DB = {
    _cache: null,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          this._cache = JSON.parse(raw);
          if (!this._cache._v) this._cache._v = VERSION;
        } else {
          this._cache = defaultDB();
          this.save();
        }
      } catch(_) {
        this._cache = defaultDB();
      }
      return this._cache;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this._cache || defaultDB())); }
      catch(_) {}
      Events.emit('db:save', { at: Date.now() });
    },
    get path() { if (!this._cache) this.load(); return this._cache; },

    // Collections
    allQuotes()   { return [...this.path.quotes]; },
    allCustomers(){ return [...this.path.customers]; },
    allVehicles() { return [...this.path.vehicles]; },
    allPresets()  { return [...this.path.presets]; },

    // Generic CRUD helpers (by id) for each collection
    _add(col, item){ this.path[col].push(item); this.save(); Events.emit(`${col}:add`, item); return item; },
    _put(col, item){
      const i = this.path[col].findIndex(x => x.id === item.id);
      if (i >= 0) this.path[col][i] = item; else this.path[col].push(item);
      this.save(); Events.emit(`${col}:put`, item); return item;
    },
    _remove(col, id){
      const i = this.path[col].findIndex(x => x.id === id);
      if (i >= 0) {
        const [rem] = this.path[col].splice(i,1);
        this.save(); Events.emit(`${col}:remove`, rem);
        return true;
      }
      return false;
    },

    // Quotes
    addQuote(q)    { return this._add('quotes', q); },
    putQuote(q)    { return this._put('quotes', q); },
    removeQuote(id){ return this._remove('quotes', id); },
    getQuote(id)   { return this.path.quotes.find(q => q.id === id) || null; },

    // Customers
    addCustomer(c)     { return this._add('customers', c); },
    putCustomer(c)     { return this._put('customers', c); },
    removeCustomer(id) { return this._remove('customers', id); },
    getCustomer(id)    { return this.path.customers.find(c => c.id === id) || null; },

    // Vehicles
    addVehicle(v)     { return this._add('vehicles', v); },
    putVehicle(v)     { return this._put('vehicles', v); },
    removeVehicle(id) { return this._remove('vehicles', id); },
    getVehicle(id)    { return this.path.vehicles.find(v => v.id === id) || null; },

    // Presets
    addPreset(p)     { return this._add('presets', p); },
    putPreset(p)     { return this._put('presets', p); },
    removePreset(id) { return this._remove('presets', id); },
    getPreset(id)    { return this.path.presets.find(p => p.id === id) || null; }
  };

  // -----------------------------
  // Models / Factories
  // -----------------------------
  // Line types: 'labor' | 'part' | 'fee' | 'discount'
  const Line = (overrides={}) => ({
    id: uid('line'),
    type: 'labor',
    label: '',         // e.g., "Front brakes"
    qty: 1,            // labor hours or part qty
    rate: 0,           // labor rate or unit price
    markup: 0,         // % markup (for parts or custom)
    retail: null,      // optional explicit retail override
    taxable: true,     // parts taxable, labor usually false
    group: 0,          // for future grouping
    auto: false,       // parsed/auto-added indicator
    sold: false,       // sold flag per line
    notes: '',
    ...overrides
  });

  const Quote = (overrides={}) => ({
    id: uid('quote'),
    createdAt: todayISO(),
    updatedAt: todayISO(),
    title: '',             // “Brakes + Oil”
    customerId: null,
    vehicleId: null,
    roNumber: '',          // optional RO
    currency: 'USD',       // snapshot at time of quote
    reservePct: 0,         // customizable reserve %
    processingPct: 0,      // processing fee % (for analytics only)
    taxPct: 0,             // sales tax on taxable items (parts)
    tripFee: 0,            // editable generic fee (can rename later)
    lines: [],             // Line[]
    sold: false,           // overall sold
    soldMeta: {            // extra info when marked sold
      method: 'card',      // 'card' | 'cash' | 'other'
      paidAt: null
    },
    // audit
    history: [],           // { at, action, payload }
    ...overrides
  });

  const Customer = (overrides={}) => ({
    id: uid('cust'),
    name: '',
    phone: '',
    email: '',
    notes: '',
    createdAt: todayISO(),
    ...overrides
  });

  const Vehicle = (overrides={}) => ({
    id: uid('veh'),
    year: '',
    make: '',
    model: '',
    vin: '',
    plate: '',
    ownerCustomerId: null,
    createdAt: todayISO(),
    ...overrides
  });

  const Preset = (overrides={}) => ({
    id: uid('pre'),
    name: '',
    scope: {            // optional scoping (for future parsing)
      year: '', make: '', model: ''
    },
    lines: [],          // Line[]
    createdAt: todayISO(),
    ...overrides
  });

  const Models = { Line, Quote, Customer, Vehicle, Preset };

  // -----------------------------
  // Expose to window.QAM
  // -----------------------------
  window.QAM = window.QAM || {};
  window.QAM.DB = DB;
  window.QAM.Models = Models;
  window.QAM.Events = Events;

  // Initialize DB cache on load
  DB.load();
})();