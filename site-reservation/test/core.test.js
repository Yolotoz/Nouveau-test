process.env.TZ = 'Europe/Paris';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableSlots, bookableDates, normalizePhone, parseDateKey, validateBooking } from '../public/js/core.js';

// Mercredi 4 novembre 2026, 10h00
const now = new Date(2026, 10, 4, 10, 0);
const WED = '2026-11-04';
const MON = '2026-11-09';

test('le jour de test est bien un mercredi', () => {
  assert.equal(now.getDay(), 3);
  assert.equal(parseDateKey(MON).getDay(), 1);
});

test('créneaux du jour : délai minimum, pause déjeuner, fermeture', () => {
  const slots = availableSlots({ date: WED, serviceId: 'coupe', now });
  assert.equal(slots[0], 11 * 60); // 10h + 1 h de délai
  assert.ok(slots.includes(12 * 60)); // 12h00-12h30 rentre avant la pause
  assert.ok(!slots.includes(12 * 60 + 15)); // déborderait sur la pause
  assert.ok(slots.includes(13 * 60 + 30));
  assert.equal(slots.at(-1), 18 * 60 + 30); // dernier créneau avant 19h
});

test('les rendez-vous existants bloquent les créneaux qui se chevauchent', () => {
  const bookings = [{ start: 11 * 60, end: 11 * 60 + 30 }];
  const slots = availableSlots({ date: WED, serviceId: 'coupe', bookings, now });
  assert.ok(!slots.includes(11 * 60));
  assert.ok(!slots.includes(11 * 60 + 15));
  assert.ok(slots.includes(11 * 60 + 30));
});

test('jours fermés, passés ou trop lointains : aucun créneau', () => {
  assert.deepEqual(availableSlots({ date: MON, serviceId: 'coupe', now }), []);
  assert.deepEqual(availableSlots({ date: '2026-11-03', serviceId: 'coupe', now }), []);
  assert.deepEqual(availableSlots({ date: '2027-03-01', serviceId: 'coupe', now }), []);
  assert.deepEqual(availableSlots({ date: '2026-12-25', serviceId: 'coupe', now }), []);
  assert.deepEqual(availableSlots({ date: WED, serviceId: 'inconnu', now }), []);
  assert.ok(!bookableDates(now).includes(MON));
  assert.equal(bookableDates(now)[0], WED);
});

test('numéros de téléphone', () => {
  assert.equal(normalizePhone('06 12 34 56 78'), '0612345678');
  assert.equal(normalizePhone('+33 6 12 34 56 78'), '0612345678');
  assert.equal(normalizePhone('06.12.34.56.78'), '0612345678');
  assert.equal(normalizePhone('+32470123456'), '+32470123456');
  assert.equal(normalizePhone('123'), null);
  assert.equal(normalizePhone(''), null);
});

test('validation d’une réservation', () => {
  const base = { serviceId: 'coupe', date: WED, start: 14 * 60, name: '  Jean   Dupont ', phone: '0612345678' };
  const ok = validateBooking(base, [], now);
  assert.equal(ok.ok, true);
  assert.equal(ok.booking.name, 'Jean Dupont');
  assert.equal(ok.booking.end, 14 * 60 + 30);

  assert.equal(validateBooking({ ...base, name: 'J' }, [], now).code, 'invalid');
  assert.equal(validateBooking({ ...base, phone: 'abc' }, [], now).code, 'invalid');
  assert.equal(validateBooking({ ...base, start: 'abc' }, [], now).code, 'invalid');
  assert.equal(validateBooking({ ...base, start: 14 * 60 + 7 }, [], now).code, 'taken');
  assert.equal(validateBooking(base, [{ start: 14 * 60, end: 14 * 60 + 30 }], now).code, 'taken');
});
