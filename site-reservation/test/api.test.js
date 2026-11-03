process.env.TZ = 'Europe/Paris';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { openDb } from '../src/db.js';

const now = new Date(2026, 10, 4, 10, 0); // mercredi 4 nov. 2026, 10h
const DATE = '2026-11-04';
let server;
let base;

before(async () => {
  const app = createApp({ db: openDb(':memory:'), adminPassword: 'secret', now: () => now });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

const slotsFor = async (date = DATE) =>
  (await (await fetch(`${base}/api/availability?date=${date}&service=coupe`)).json()).slots;

let bookingId;
let cookie;

test('les pages sont servies', async () => {
  for (const page of ['/', '/admin.html', '/js/core.js', '/css/style.css']) {
    assert.equal((await fetch(base + page)).status, 200, page);
  }
});

test('disponibilités', async () => {
  const slots = await slotsFor();
  assert.equal(slots[0], 660);
  assert.equal((await fetch(`${base}/api/availability?date=nope&service=coupe`)).status, 400);
});

test('réservation, puis double réservation refusée', async () => {
  const booking = { serviceId: 'coupe', date: DATE, start: 660, name: 'Jean Dupont', phone: '06 12 34 56 78' };
  const first = await post('/api/bookings', booking);
  assert.equal(first.status, 201);
  const body = await first.json();
  bookingId = body.booking.id;
  assert.equal(body.booking.phone, undefined, 'le téléphone ne doit pas être renvoyé publiquement');

  const second = await post('/api/bookings', { ...booking, name: 'Paul Martin' });
  assert.equal(second.status, 409);
  assert.ok(!(await slotsFor()).includes(660));

  const invalid = await post('/api/bookings', { ...booking, start: 900, phone: 'xx' });
  assert.equal(invalid.status, 400);
});

test('espace gérant protégé par mot de passe', async () => {
  assert.equal((await fetch(`${base}/api/admin/bookings`)).status, 401);
  assert.equal((await post('/api/admin/login', { password: 'faux' })).status, 401);

  const login = await post('/api/admin/login', { password: 'secret' });
  assert.equal(login.status, 200);
  cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);

  const list = await (await fetch(`${base}/api/admin/bookings`, { headers: { cookie } })).json();
  assert.equal(list.bookings.length, 1);
  assert.equal(list.bookings[0].phone, '0612345678');
});

test('annulation : le créneau redevient libre', async () => {
  const cancel = await post(`/api/admin/bookings/${bookingId}/cancel`, {}, { cookie });
  assert.equal(cancel.status, 200);
  assert.ok((await slotsFor()).includes(660));
  assert.equal((await post(`/api/admin/bookings/${bookingId}/cancel`, {}, { cookie })).status, 404);
});

test('déconnexion', async () => {
  await post('/api/admin/logout', {}, { cookie });
  assert.equal((await fetch(`${base}/api/admin/bookings`, { headers: { cookie } })).status, 401);
});
