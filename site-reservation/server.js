// Serveur du site de réservation : pages, API publique et espace gérant.

process.env.TZ = process.env.TIMEZONE || 'Europe/Paris';

import express from 'express';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './src/db.js';
import { availableSlots, dateKey, getService, parseDateKey, validateBooking } from './public/js/core.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SESSION_COOKIE = 'admin_session';
const SESSION_HOURS = 12;

// Limite simple du nombre de requêtes par adresse IP (anti-spam)
function rateLimiter({ max, windowMs }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessaie un peu plus tard.' });
    }
    next();
  };
}

const sameSecret = (a, b) => {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
};

function readCookie(req, name) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function createApp({ db, adminPassword, now = () => new Date() }) {
  const app = express();
  const sessions = new Map(); // jeton → date d'expiration

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10kb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });

  // --- API publique -------------------------------------------------------

  app.get('/api/availability', (req, res) => {
    const { date, service } = req.query;
    if (!parseDateKey(date) || !getService(service)) {
      return res.status(400).json({ error: 'Paramètres invalides.' });
    }
    const slots = availableSlots({ date, serviceId: service, bookings: db.bookingsForDate(date), now: now() });
    res.json({ slots });
  });

  app.post('/api/bookings', rateLimiter({ max: 10, windowMs: 60 * 60_000 }), (req, res) => {
    const date = req.body?.date;
    const existing = parseDateKey(date) ? db.bookingsForDate(date) : [];
    // Node.js traite les requêtes une par une ici : la vérification et l'enregistrement
    // se suivent sans interruption, donc deux clients ne peuvent pas prendre le même créneau.
    const result = validateBooking(req.body, existing, now());
    if (!result.ok) {
      return res.status(result.code === 'taken' ? 409 : 400).json({ error: result.error });
    }
    const booking = db.insertBooking(result.booking);
    const { phone, ...publicBooking } = booking;
    res.status(201).json({ booking: publicBooking });
  });

  // --- Espace gérant ------------------------------------------------------

  const isLoggedIn = (req) => {
    const token = readCookie(req, SESSION_COOKIE);
    const expires = token && sessions.get(token);
    if (!expires) return false;
    if (expires < Date.now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  };

  const requireAdmin = (req, res, next) => {
    if (!adminPassword) return res.status(503).json({ error: 'Espace gérant désactivé (ADMIN_PASSWORD manquant).' });
    if (!isLoggedIn(req)) return res.status(401).json({ error: 'Connexion requise.' });
    next();
  };

  app.post('/api/admin/login', rateLimiter({ max: 5, windowMs: 15 * 60_000 }), (req, res) => {
    if (!adminPassword) return res.status(503).json({ error: 'Espace gérant désactivé (ADMIN_PASSWORD manquant).' });
    if (!sameSecret(req.body?.password ?? '', adminPassword)) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    const token = randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_HOURS * 3_600_000);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure,
      maxAge: SESSION_HOURS * 3_600_000,
      path: '/',
    });
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) sessions.delete(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/admin/bookings', requireAdmin, (req, res) => {
    const from = parseDateKey(req.query.from) ? req.query.from : dateKey(now());
    res.json({ bookings: db.bookingsFrom(from) });
  });

  app.post('/api/admin/bookings/:id/cancel', requireAdmin, (req, res) => {
    if (!db.cancelBooking(req.params.id)) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
    res.json({ ok: true });
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Introuvable.' }));

  // --- Pages du site -----------------------------------------------------
  app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'] }));

  return app;
}

// Lancement direct : node server.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const db = openDb(process.env.DATABASE_FILE || path.join(ROOT, 'data', 'reservations.db'));
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD non défini : l’espace gérant est désactivé.');
  }
  createApp({ db, adminPassword: process.env.ADMIN_PASSWORD }).listen(port, () => {
    console.log(`Site de réservation : http://localhost:${port}`);
  });
}
