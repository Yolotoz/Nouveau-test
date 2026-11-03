// Traductions (français / anglais) et formats de date et d'heure.
// Langue choisie : ?lang=en ou ?lang=fr dans l'adresse, sinon le dernier choix, sinon celle du commerce.

import { CONFIG } from './config.js';
import { parseDateKey } from './core.js';

const DICT = {
  fr: {
    'meta.title': "Réservation en ligne",
    'demo.banner': 'Démo : entreprise fictive, les réservations restent dans votre navigateur',
    'demo.adminBanner': 'Démo : mot de passe « demo »',
    'nav.info': 'Horaires & accès',
    'nav.book': 'Réserver',
    'hero.eyebrow': 'Barbier · Réservation en ligne',
    'hero.title': 'Ton créneau en 30 secondes.',
    'hero.text': "Choisis ta prestation, ton jour et ton heure. Pas d'appel, pas d'attente : on t'attend.",
    'hero.cta': '📅 Réserver maintenant',
    'booking.eyebrow': 'Réservation',
    'booking.title': 'Prendre rendez-vous',
    'step.service': 'Prestation',
    'step.date': 'Jour',
    'step.slot': 'Heure',
    'step.details': 'Tes coordonnées',
    'slots.pickFirst': "Choisis d'abord une prestation et un jour.",
    'slots.loading': 'Chargement des créneaux…',
    'slots.error': 'Impossible de charger les créneaux. Réessaie.',
    'slots.none': 'Plus de créneau libre ce jour-là. Essaie un autre jour.',
    'form.name': 'Nom et prénom',
    'form.phone': 'Téléphone',
    'form.submit': 'Confirmer le rendez-vous',
    'form.sending': 'Envoi…',
    'form.at': 'à',
    'done.title': "C'est réservé !",
    'done.text': "On t'attend. En cas d'empêchement, préviens-nous par téléphone.",
    'done.again': 'Faire une autre réservation',
    'info.eyebrow': 'Infos pratiques',
    'info.title': 'Horaires & accès',
    'info.hours': 'Horaires',
    'info.find': 'Nous trouver',
    'info.address': 'Adresse',
    'info.phone': 'Téléphone',
    'info.closed': 'Fermé',
    'footer.admin': 'Espace gérant',
    'error.service': 'Prestation inconnue.',
    'error.date': 'Date invalide.',
    'error.name': 'Indique ton nom (2 à 60 caractères).',
    'error.phone': 'Numéro de téléphone invalide.',
    'error.start': 'Créneau invalide.',
    'error.taken': "Ce créneau n'est plus disponible. Choisis-en un autre.",
    'error.tooMany': 'Trop de tentatives. Réessaie un peu plus tard.',
    'error.network': 'Problème de connexion. Réessaie.',
    'error.generic': 'Réservation impossible.',
    'admin.title': 'Espace gérant',
    'admin.viewSite': 'Voir le site',
    'admin.logout': 'Déconnexion',
    'admin.password': 'Mot de passe',
    'admin.login': 'Se connecter',
    'admin.wrongPassword': 'Mot de passe incorrect.',
    'admin.disabled': 'Espace gérant désactivé (ADMIN_PASSWORD manquant).',
    'admin.upcoming': 'Rendez-vous à venir',
    'admin.refresh': '↻ Actualiser',
    'admin.today': "aujourd'hui",
    'admin.week': '7 prochains jours',
    'admin.revenue': 'CA prévu (7 j)',
    'admin.none': 'Aucun rendez-vous à venir.',
    'admin.cancelled': 'Annulé',
    'admin.cancel': 'Annuler',
    'admin.confirmCancel': 'Annuler le rendez-vous de {name} à {time} ?',
    'admin.loadError': 'Erreur de chargement.',
    'unit.min': 'min',
  },
  en: {
    'meta.title': 'Online booking',
    'demo.banner': 'Demo: fictional business, bookings stay in your browser',
    'demo.adminBanner': 'Demo: password "demo"',
    'nav.info': 'Hours & location',
    'nav.book': 'Book',
    'hero.eyebrow': 'Barber · Online booking',
    'hero.title': 'Your slot in 30 seconds.',
    'hero.text': 'Pick your service, your day and your time. No calls, no waiting: we’ll be ready for you.',
    'hero.cta': '📅 Book now',
    'booking.eyebrow': 'Booking',
    'booking.title': 'Book an appointment',
    'step.service': 'Service',
    'step.date': 'Day',
    'step.slot': 'Time',
    'step.details': 'Your details',
    'slots.pickFirst': 'Choose a service and a day first.',
    'slots.loading': 'Loading time slots…',
    'slots.error': 'Could not load time slots. Please try again.',
    'slots.none': 'No free slots left that day. Try another day.',
    'form.name': 'Full name',
    'form.phone': 'Phone',
    'form.submit': 'Confirm appointment',
    'form.sending': 'Sending…',
    'form.at': 'at',
    'done.title': 'You’re booked!',
    'done.text': 'See you soon. If you can’t make it, please give us a call.',
    'done.again': 'Make another booking',
    'info.eyebrow': 'Practical info',
    'info.title': 'Hours & location',
    'info.hours': 'Opening hours',
    'info.find': 'Find us',
    'info.address': 'Address',
    'info.phone': 'Phone',
    'info.closed': 'Closed',
    'footer.admin': 'Owner area',
    'error.service': 'Unknown service.',
    'error.date': 'Invalid date.',
    'error.name': 'Please enter your name (2 to 60 characters).',
    'error.phone': 'Invalid phone number.',
    'error.start': 'Invalid time slot.',
    'error.taken': 'This slot is no longer available. Please pick another one.',
    'error.tooMany': 'Too many attempts. Please try again later.',
    'error.network': 'Connection problem. Please try again.',
    'error.generic': 'Booking failed.',
    'admin.title': 'Owner area',
    'admin.viewSite': 'View site',
    'admin.logout': 'Log out',
    'admin.password': 'Password',
    'admin.login': 'Log in',
    'admin.wrongPassword': 'Wrong password.',
    'admin.disabled': 'Owner area disabled (ADMIN_PASSWORD missing).',
    'admin.upcoming': 'Upcoming appointments',
    'admin.refresh': '↻ Refresh',
    'admin.today': 'today',
    'admin.week': 'next 7 days',
    'admin.revenue': 'expected revenue (7 d)',
    'admin.none': 'No upcoming appointments.',
    'admin.cancelled': 'Cancelled',
    'admin.cancel': 'Cancel',
    'admin.confirmCancel': 'Cancel the appointment of {name} at {time}?',
    'admin.loadError': 'Loading error.',
    'unit.min': 'min',
  },
};

const DAYS = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const MONTHS = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

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
    /* stockage indisponible */
  }
}

function detectLanguage() {
  const supported = Object.keys(DICT);
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (supported.includes(fromUrl)) {
    storageSet('lang', fromUrl);
    return fromUrl;
  }
  const saved = storageGet('lang');
  if (supported.includes(saved)) return saved;
  return supported.includes(CONFIG.defaultLanguage) ? CONFIG.defaultLanguage : 'fr';
}

export const LANG = detectLanguage();

/** Texte traduit ; {nom} est remplacé par vars.nom */
export function t(key, vars = {}) {
  const text = DICT[LANG][key] ?? DICT.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

/** Valeur de configuration traduisible : "texte" ou { fr: "...", en: "..." } */
export function tr(value) {
  if (value && typeof value === 'object') return value[LANG] ?? value.fr ?? Object.values(value)[0];
  return value;
}

export const dayName = (index) => DAYS[LANG][index];
export const monthName = (index) => MONTHS[LANG][index];

/** Minutes depuis minuit → "9h30" (fr) ou "9:30 AM" (en) ; compact : "9h" / "9am" */
export function formatTime(total, { compact = false } = {}) {
  const h = Math.floor(total / 60);
  const m = String(total % 60).padStart(2, '0');
  if (LANG === 'en') {
    const h12 = ((h + 11) % 12) + 1;
    const suffix = h < 12 ? 'AM' : 'PM';
    return compact ? `${h12}${m === '00' ? '' : ':' + m}${suffix.toLowerCase()}` : `${h12}:${m} ${suffix}`;
  }
  return compact && m === '00' ? `${h}h` : `${h}h${m}`;
}

/** "AAAA-MM-JJ" → "mar. 4 nov." / "Tue, Nov 4" (long : "Mardi 4 nov." / "Tuesday, Nov 4") */
export function formatDate(key, { long = false } = {}) {
  const date = parseDateKey(key);
  if (!date) return key;
  const day = dayName(date.getDay());
  if (LANG === 'en') return `${long ? day : day.slice(0, 3)}, ${monthName(date.getMonth())} ${date.getDate()}`;
  return `${long ? day : day.slice(0, 3) + '.'} ${date.getDate()} ${monthName(date.getMonth())}`;
}

/** Applique les traductions aux éléments marqués data-i18n et ajoute le bouton FR / EN */
export function translatePage() {
  document.documentElement.lang = LANG;
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    const other = LANG === 'fr' ? 'en' : 'fr';
    const url = new URL(location.href);
    url.searchParams.set('lang', other);
    toggle.href = url.pathname + url.search + url.hash;
    toggle.textContent = other.toUpperCase();
    toggle.setAttribute('aria-label', other === 'en' ? 'English version' : 'Version française');
  }
}
