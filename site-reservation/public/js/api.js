// Accès aux données. Deux modes :
// - normal : on parle au serveur (/api/...)
// - démo   : tout est simulé dans le navigateur (GitHub Pages, fichier ouvert en local, ou ?demo dans l'adresse)

import { CONFIG } from './config.js';
import { availableSlots, bookableDates, dateKey, validateBooking } from './core.js';

export const DEMO =
  location.hostname.endsWith('github.io') ||
  location.protocol === 'file:' ||
  new URLSearchParams(location.search).has('demo');

export const DEMO_PASSWORD = 'demo';

// ---------------------------------------------------------------------------
// Mode serveur

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

const server = {
  async getSlots(date, serviceId) {
    const r = await request(`api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(serviceId)}`);
    if (!r.ok) throw new Error(r.data.error || 'Erreur de chargement');
    return r.data.slots;
  },
  async createBooking(payload) {
    const r = await request('api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    return r.ok ? { ok: true, booking: r.data.booking } : { ok: false, taken: r.status === 409, error: r.data.error };
  },
  async login(password) {
    const r = await request('api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    return r.ok ? { ok: true } : { ok: false, error: r.data.error };
  },
  async logout() {
    await request('api/admin/logout', { method: 'POST' });
  },
  async listBookings() {
    const r = await request('api/admin/bookings');
    if (r.status === 401) return null;
    if (!r.ok) throw new Error(r.data.error || 'Erreur de chargement');
    return r.data.bookings;
  },
  async cancelBooking(id) {
    const r = await request(`api/admin/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
    return r.ok;
  },
};

// ---------------------------------------------------------------------------
// Mode démo (données dans le navigateur uniquement)

const STORE_KEY = 'reservation-demo-v1';
const SESSION_KEY = 'reservation-demo-admin';
let memory = null; // secours si le stockage du navigateur est bloqué

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : on garde en mémoire */
  }
}

// Quelques faux rendez-vous pour que l'agenda ait l'air vivant
function seedBookings() {
  const names = ['Karim B.', 'Lucas M.', 'Hugo D.', 'Yanis T.', 'Nathan R.', 'Enzo P.', 'Mehdi A.', 'Tom L.'];
  const list = [];
  bookableDates().slice(0, 8).forEach((date, dayIndex) => {
    for (let i = 0; i < 3; i++) {
      const service = CONFIG.services[(dayIndex + i) % CONFIG.services.length];
      const slots = availableSlots({ date, serviceId: service.id, bookings: list.filter((b) => b.date === date) });
      if (!slots.length) continue;
      const start = slots[(dayIndex * 7 + i * 11) % slots.length];
      list.push({
        id: `demo-${date}-${i}`,
        serviceId: service.id,
        date,
        start,
        end: start + service.duration,
        name: names[(dayIndex + i * 3) % names.length],
        phone: '0600000000',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });
    }
  });
  return list;
}

function demoLoad() {
  if (memory) return memory;
  try {
    const saved = JSON.parse(storageGet(STORE_KEY));
    if (Array.isArray(saved)) return (memory = saved);
  } catch {
    /* données illisibles : on repart de zéro */
  }
  memory = seedBookings();
  storageSet(STORE_KEY, JSON.stringify(memory));
  return memory;
}

function demoSave(list) {
  memory = list;
  storageSet(STORE_KEY, JSON.stringify(list));
}

const confirmedOn = (date) => demoLoad().filter((b) => b.date === date && b.status === 'confirmed');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let demoLoggedIn = storageGet(SESSION_KEY) === '1';

const demo = {
  async getSlots(date, serviceId) {
    await wait(150);
    return availableSlots({ date, serviceId, bookings: confirmedOn(date) });
  },
  async createBooking(payload) {
    await wait(300);
    const result = validateBooking(payload, confirmedOn(payload.date));
    if (!result.ok) return { ok: false, taken: result.code === 'taken', error: result.error };
    const booking = {
      ...result.booking,
      id: `demo-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    demoSave([...demoLoad(), booking]);
    return { ok: true, booking };
  },
  async login(password) {
    await wait(200);
    if (password !== DEMO_PASSWORD) return { ok: false, error: 'Mot de passe incorrect (démo : « demo »).' };
    demoLoggedIn = true;
    storageSet(SESSION_KEY, '1');
    return { ok: true };
  },
  async logout() {
    demoLoggedIn = false;
    storageSet(SESSION_KEY, '0');
  },
  async listBookings() {
    if (!demoLoggedIn) return null;
    const today = dateKey(new Date());
    return demoLoad()
      .filter((b) => b.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  },
  async cancelBooking(id) {
    const list = demoLoad().map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b));
    demoSave(list);
    return true;
  },
};

export const api = DEMO ? demo : server;
