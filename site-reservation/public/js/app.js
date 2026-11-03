// Page publique : affichage des prestations, des horaires et parcours de réservation.

import { CONFIG } from './config.js';
import { DAY_NAMES, bookableDates, formatDate, formatMinutes, getService, parseDateKey } from './core.js';
import { api, DEMO } from './api.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const state = { serviceId: null, date: null, start: null };

// --- Infos fixes ------------------------------------------------------------

if (DEMO) $('demo-banner').classList.remove('hidden');
$('year').textContent = new Date().getFullYear();
$('address').textContent = CONFIG.address;
$('phone-link').textContent = CONFIG.phoneDisplay;
$('phone-link').href = `tel:${CONFIG.phone}`;

const todayIndex = new Date().getDay();
for (const day of [1, 2, 3, 4, 5, 6, 0]) {
  const ranges = CONFIG.hours[day] ?? [];
  const text = ranges.length ? ranges.map(([a, b]) => `${a.replace(':', 'h')} – ${b.replace(':', 'h')}`).join(' · ') : 'Fermé';
  $('hours').append(
    el('li', { className: day === todayIndex ? 'today' : '' }, [
      el('span', { textContent: DAY_NAMES[day] }),
      el('span', { textContent: text, className: ranges.length ? '' : 'closed' }),
    ]),
  );
}

// --- Étapes -----------------------------------------------------------------

function unlock(stepId, unlocked) {
  $(stepId).classList.toggle('locked', !unlocked);
}

function press(container, selected) {
  for (const button of container.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button === selected));
  }
}

function renderServices() {
  for (const service of CONFIG.services) {
    const button = el('button', { type: 'button', className: 'choice' }, [
      el('div', { className: 'row' }, [
        el('span', { textContent: service.name }),
        el('span', { className: 'price', textContent: `${service.price} €` }),
      ]),
      el('small', { textContent: `${service.duration} min · ${service.description}` }),
    ]);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      state.serviceId = service.id;
      press($('services'), button);
      unlock('step-date', true);
      if (state.date) loadSlots();
      else $('step-date').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    $('services').append(button);
  }
}

function renderDates() {
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  for (const key of bookableDates()) {
    const date = parseDateKey(key);
    const button = el('button', { type: 'button', className: 'date' }, [
      el('div', { className: 'dow', textContent: DAY_NAMES[date.getDay()].slice(0, 3) }),
      el('div', { className: 'day', textContent: String(date.getDate()) }),
      el('div', { className: 'month', textContent: months[date.getMonth()] }),
    ]);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', formatDate(key, { long: true }));
    button.addEventListener('click', () => {
      state.date = key;
      press($('dates'), button);
      loadSlots();
    });
    $('dates').append(button);
  }
}

let slotsRequest = 0;
async function loadSlots() {
  if (!state.serviceId || !state.date) return;
  state.start = null;
  unlock('step-slot', true);
  unlock('step-form', false);

  const container = $('slots');
  container.replaceChildren(el('p', { className: 'empty', textContent: 'Chargement des créneaux…' }));
  const requestId = ++slotsRequest;

  let slots;
  try {
    slots = await api.getSlots(state.date, state.serviceId);
  } catch {
    if (requestId === slotsRequest) {
      container.replaceChildren(el('p', { className: 'empty', textContent: 'Impossible de charger les créneaux. Réessaie.' }));
    }
    return;
  }
  if (requestId !== slotsRequest) return; // une autre demande plus récente est en cours

  if (!slots.length) {
    container.replaceChildren(el('p', { className: 'empty', textContent: 'Plus de créneau libre ce jour-là. Essaie un autre jour.' }));
    return;
  }
  container.replaceChildren(
    ...slots.map((start) => {
      const button = el('button', { type: 'button', className: 'slot', textContent: formatMinutes(start) });
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        state.start = start;
        press(container, button);
        showSummary();
        unlock('step-form', true);
        $('step-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      return button;
    }),
  );
  $('step-slot').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function summaryNodes() {
  const service = getService(state.serviceId);
  return [
    el('strong', { textContent: service.name }),
    ` · ${service.duration} min · ${service.price} €`,
    el('br'),
    el('strong', { textContent: formatDate(state.date, { long: true }) }),
    ` à `,
    el('strong', { textContent: formatMinutes(state.start) }),
  ];
}

function showSummary() {
  $('summary').replaceChildren(...summaryNodes());
  $('form-error').textContent = '';
}

// --- Envoi ------------------------------------------------------------------

$('step-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = $('submit');
  $('form-error').textContent = '';
  submit.disabled = true;
  submit.textContent = 'Envoi…';

  try {
    const result = await api.createBooking({
      serviceId: state.serviceId,
      date: state.date,
      start: state.start,
      name: $('name').value,
      phone: $('phone').value,
    });

    if (result.ok) {
      $('done-summary').replaceChildren(...summaryNodes());
      $('booking-steps').classList.add('hidden');
      $('done').classList.remove('hidden');
      $('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      $('form-error').textContent = result.error || 'Réservation impossible.';
      if (result.taken) loadSlots();
    }
  } catch {
    $('form-error').textContent = 'Problème de connexion. Réessaie.';
  } finally {
    submit.disabled = false;
    submit.textContent = 'Confirmer le rendez-vous';
  }
});

$('again').addEventListener('click', () => {
  state.start = null;
  $('done').classList.add('hidden');
  $('booking-steps').classList.remove('hidden');
  loadSlots();
});

renderServices();
renderDates();
