// Page publique : affichage des prestations, des horaires et parcours de réservation.

import { CONFIG } from './config.js';
import { bookableDates, getService, parseDateKey } from './core.js';
import { api, DEMO } from './api.js';
import { dayName, formatDate, formatTime, LANG, monthName, t, tr, translatePage } from './i18n.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const state = { serviceId: null, date: null, start: null };
const price = (amount) => (LANG === 'en' ? `${CONFIG.currency}${amount}` : `${amount} ${CONFIG.currency}`);
const keepLang = (href) => `${href}?lang=${LANG}${DEMO && new URLSearchParams(location.search).has('demo') ? '&demo' : ''}`;

// --- Infos fixes ------------------------------------------------------------

translatePage();
document.title = `${CONFIG.businessName} · ${t('meta.title')}`;
if (DEMO) $('demo-banner').classList.remove('hidden');
$('admin-link').href = keepLang('admin.html');
$('year').textContent = new Date().getFullYear();
$('address').textContent = tr(CONFIG.address);
$('phone-link').textContent = CONFIG.phoneDisplay;
$('phone-link').href = `tel:${CONFIG.phone}`;

const todayIndex = new Date().getDay();
for (const day of [1, 2, 3, 4, 5, 6, 0]) {
  const ranges = CONFIG.hours[day] ?? [];
  const text = ranges.length
    ? ranges.map(([a, b]) => `${formatTime(toMin(a), { compact: true })}–${formatTime(toMin(b), { compact: true })}`).join(' · ')
    : t('info.closed');
  $('hours').append(
    el('li', { className: day === todayIndex ? 'today' : '' }, [
      el('span', { textContent: dayName(day) }),
      el('span', { textContent: text, className: ranges.length ? '' : 'closed' }),
    ]),
  );
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
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
        el('span', { textContent: tr(service.name) }),
        el('span', { className: 'price', textContent: price(service.price) }),
      ]),
      el('small', { textContent: `${service.duration} ${t('unit.min')} · ${tr(service.description)}` }),
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
  for (const key of bookableDates()) {
    const date = parseDateKey(key);
    const button = el('button', { type: 'button', className: 'date' }, [
      el('div', { className: 'dow', textContent: dayName(date.getDay()).slice(0, 3) }),
      el('div', { className: 'day', textContent: String(date.getDate()) }),
      el('div', { className: 'month', textContent: monthName(date.getMonth()) }),
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
  container.replaceChildren(el('p', { className: 'empty', textContent: t('slots.loading') }));
  const requestId = ++slotsRequest;

  let slots;
  try {
    slots = await api.getSlots(state.date, state.serviceId);
  } catch {
    if (requestId === slotsRequest) {
      container.replaceChildren(el('p', { className: 'empty', textContent: t('slots.error') }));
    }
    return;
  }
  if (requestId !== slotsRequest) return; // une demande plus récente est en cours

  if (!slots.length) {
    container.replaceChildren(el('p', { className: 'empty', textContent: t('slots.none') }));
    return;
  }
  container.replaceChildren(
    ...slots.map((start) => {
      const button = el('button', { type: 'button', className: 'slot', textContent: formatTime(start) });
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
    el('strong', { textContent: tr(service.name) }),
    ` · ${service.duration} ${t('unit.min')} · ${price(service.price)}`,
    el('br'),
    el('strong', { textContent: formatDate(state.date, { long: true }) }),
    ` ${t('form.at')} `,
    el('strong', { textContent: formatTime(state.start) }),
  ];
}

function showSummary() {
  $('summary').replaceChildren(...summaryNodes());
  $('form-error').textContent = '';
}

function errorMessage(result) {
  if (result.status === 429) return t('error.tooMany');
  if (result.code === 'taken') return t('error.taken');
  if (result.field) return t(`error.${result.field}`);
  return t('error.generic');
}

// --- Envoi ------------------------------------------------------------------

$('step-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = $('submit');
  $('form-error').textContent = '';
  submit.disabled = true;
  submit.textContent = t('form.sending');

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
      $('form-error').textContent = errorMessage(result);
      if (result.code === 'taken') loadSlots();
    }
  } catch {
    $('form-error').textContent = t('error.network');
  } finally {
    submit.disabled = false;
    submit.textContent = t('form.submit');
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
