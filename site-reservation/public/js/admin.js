// Espace gérant : connexion, liste des rendez-vous, annulation.

import { dateKey, formatDate, formatMinutes, getService } from './core.js';
import { api, DEMO } from './api.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

if (DEMO) $('demo-banner').classList.remove('hidden');

function show(view) {
  $('login').classList.toggle('hidden', view !== 'login');
  $('dashboard').classList.toggle('hidden', view !== 'dashboard');
  $('logout').classList.toggle('hidden', view !== 'dashboard');
}

function renderStats(bookings) {
  const today = dateKey(new Date());
  const in7 = new Date();
  in7.setDate(in7.getDate() + 6);
  const limit = dateKey(in7);
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const week = confirmed.filter((b) => b.date <= limit);
  $('stat-today').textContent = confirmed.filter((b) => b.date === today).length;
  $('stat-week').textContent = week.length;
  $('stat-revenue').textContent = `${week.reduce((sum, b) => sum + (getService(b.serviceId)?.price ?? 0), 0)} €`;
}

function renderList(bookings) {
  const list = $('list');
  if (!bookings.length) {
    list.replaceChildren(el('p', { className: 'empty', textContent: 'Aucun rendez-vous à venir.' }));
    return;
  }

  const byDate = new Map();
  for (const b of bookings) {
    if (!byDate.has(b.date)) byDate.set(b.date, []);
    byDate.get(b.date).push(b);
  }

  list.replaceChildren(
    ...[...byDate].map(([date, items]) =>
      el('div', { className: 'day-group' }, [
        el('h3', { textContent: formatDate(date, { long: true }) }),
        ...items.map((b) => {
          const service = getService(b.serviceId);
          const cancelled = b.status !== 'confirmed';
          const actions = el('div', { className: 'actions' });
          if (cancelled) {
            actions.append(el('span', { className: 'tag', textContent: 'Annulé' }));
          } else {
            const cancel = el('button', { type: 'button', className: 'btn small danger', textContent: 'Annuler' });
            cancel.addEventListener('click', async () => {
              if (!confirm(`Annuler le rendez-vous de ${b.name} à ${formatMinutes(b.start)} ?`)) return;
              cancel.disabled = true;
              if (await api.cancelBooking(b.id)) load();
              else cancel.disabled = false;
            });
            actions.append(cancel);
          }
          return el('div', { className: `appt${cancelled ? ' cancelled' : ''}` }, [
            el('div', { className: 'time', textContent: formatMinutes(b.start) }),
            el('div', { className: 'who' }, [
              el('strong', { textContent: b.name }),
              el('small', {}, [
                `${service?.name ?? b.serviceId} · ${b.end - b.start} min · `,
                el('a', { href: `tel:${b.phone}`, textContent: b.phone }),
              ]),
            ]),
            actions,
          ]);
        }),
      ]),
    ),
  );
}

async function load() {
  try {
    const bookings = await api.listBookings();
    if (bookings === null) return show('login');
    show('dashboard');
    renderStats(bookings);
    renderList(bookings);
  } catch (error) {
    show('dashboard');
    $('list').replaceChildren(el('p', { className: 'error', textContent: error.message }));
  }
}

$('login').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('login-error').textContent = '';
  const result = await api.login($('password').value);
  if (result.ok) {
    $('password').value = '';
    load();
  } else {
    $('login-error').textContent = result.error || 'Connexion impossible.';
  }
});

$('logout').addEventListener('click', async () => {
  await api.logout();
  show('login');
});

$('refresh').addEventListener('click', load);

load();
