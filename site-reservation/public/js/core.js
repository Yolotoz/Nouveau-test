// Règles de réservation, partagées entre le navigateur et le serveur :
// le serveur refait toujours les vérifications, le navigateur ne fait qu'afficher.

import { CONFIG } from './config.js';

export const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Date locale → "AAAA-MM-JJ" */
export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "AAAA-MM-JJ" → Date locale à minuit, ou null si invalide */
export function parseDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return dateKey(date) === key ? date : null;
}

export function formatDate(key, { long = false } = {}) {
  const date = parseDateKey(key);
  if (!date) return key;
  const day = DAY_NAMES[date.getDay()];
  return `${long ? day : day.slice(0, 3) + '.'} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function getService(id) {
  return CONFIG.services.find((s) => s.id === id) ?? null;
}

/** Plages d'ouverture d'un jour, en minutes : [[début, fin], ...] */
export function openingRanges(key) {
  const date = parseDateKey(key);
  if (!date || CONFIG.closedDates.includes(key)) return [];
  return (CONFIG.hours[date.getDay()] ?? []).map(([a, b]) => [toMinutes(a), toMinutes(b)]);
}

/** Jours où l'on peut réserver, à partir d'aujourd'hui */
export function bookableDates(now = new Date()) {
  const result = [];
  for (let i = 0; i <= CONFIG.daysAhead; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dateKey(day);
    if (openingRanges(key).length) result.push(key);
  }
  return result;
}

function isWithinWindow(key, now) {
  const date = parseDateKey(key);
  if (!date) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + CONFIG.daysAhead);
  return date >= today && date <= last;
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/**
 * Créneaux libres (heures de début en minutes) pour une prestation et un jour.
 * `bookings` = rendez-vous confirmés de ce jour : [{ start, end }].
 */
export function availableSlots({ date, serviceId, bookings = [], now = new Date() }) {
  const service = getService(serviceId);
  if (!service || !isWithinWindow(date, now)) return [];

  const isToday = date === dateKey(now);
  const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + CONFIG.minNoticeMinutes : -1;

  const slots = [];
  for (const [open, close] of openingRanges(date)) {
    for (let start = open; start + service.duration <= close; start += CONFIG.slotStep) {
      if (start < earliest) continue;
      const end = start + service.duration;
      if (bookings.some((b) => overlaps(start, end, b.start, b.end))) continue;
      slots.push(start);
    }
  }
  return slots;
}

export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/[\s.\-()]/g, '');
  if (/^0[1-9]\d{8}$/.test(digits)) return digits;
  if (/^\+33[1-9]\d{8}$/.test(digits)) return '0' + digits.slice(3);
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}

/**
 * Vérifie une demande de réservation.
 * @returns {{ ok: true, booking: object } | { ok: false, error: string, code: string }}
 */
export function validateBooking(input, bookingsOfDay, now = new Date()) {
  const service = getService(input?.serviceId);
  if (!service) return { ok: false, code: 'invalid', error: 'Prestation inconnue.' };
  if (!parseDateKey(input.date)) return { ok: false, code: 'invalid', error: 'Date invalide.' };

  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60) {
    return { ok: false, code: 'invalid', error: 'Indique ton nom (2 à 60 caractères).' };
  }
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, code: 'invalid', error: 'Numéro de téléphone invalide.' };

  const start = Number(input.start);
  if (!Number.isInteger(start)) return { ok: false, code: 'invalid', error: 'Créneau invalide.' };

  const free = availableSlots({ date: input.date, serviceId: service.id, bookings: bookingsOfDay, now });
  if (!free.includes(start)) {
    return { ok: false, code: 'taken', error: "Ce créneau n'est plus disponible. Choisis-en un autre." };
  }

  return {
    ok: true,
    booking: { serviceId: service.id, date: input.date, start, end: start + service.duration, name, phone },
  };
}
