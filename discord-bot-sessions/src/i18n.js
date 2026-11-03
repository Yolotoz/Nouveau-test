// Traductions du bot (français / anglais).
// La langue est déduite de Discord : celle du serveur pour les messages publics,
// celle du joueur pour les réponses privées. BOT_LANGUAGE=fr ou en force une langue.

import { REMINDER_MINUTES } from './sessions.js';

const DICT = {
  fr: {
    'card.time': '🕘 Heure',
    'card.slots': '👥 Places',
    'card.full': 'complet',
    'card.players': 'Joueurs',
    'card.waitlist': "⏳ Liste d'attente",
    'card.footer': `Rappel ${REMINDER_MINUTES} min avant le début`,
    'card.cancelled': 'Session annulée',
    'button.join': 'Rejoindre',
    'button.waitlist': "Liste d'attente",
    'button.leave': 'Quitter',
    'button.cancel': 'Annuler',
    'list.title': '📅 Prochaines sessions',
    'list.empty': 'Aucune session prévue. Lance-en une avec `/session` !',
    'reply.joined': '✅ Tu es inscrit !',
    'reply.waitlist': "⏳ C'est complet : tu es en liste d'attente.",
    'reply.left': 'Tu as quitté la session.',
    'reply.cancelled': 'Session annulée.',
    'reply.notOwner': "Seul l'organisateur ou un modérateur peut annuler.",
    'reply.notFound': 'Cette session est terminée ou introuvable.',
    'reply.badTime': 'Heure non reconnue. Exemples : `21h`, `21h30`, `21:30`, `dans 30 min`.',
    'reply.guildOnly': "Ce bot s'utilise dans un serveur.",
    'reply.error': 'Oups, une erreur est survenue. Réessaie dans un instant.',
    'reason.cancelled': 'Cette session est annulée.',
    'reason.alreadyJoined': 'Tu es déjà inscrit.',
    'reason.alreadyWaitlist': "Tu es déjà en liste d'attente.",
    'reason.notJoined': "Tu n'es pas inscrit.",
    'notice.promoted': "🎉 {user}, une place s'est libérée pour **{game}** : tu es inscrit !",
    'notice.reminder': '⏰ **{game}** commence {when} ! {players}',
    help: [
      '**🎮 Bot Sessions — mode d’emploi**',
      '`/session jeu:Valorant heure:21h places:5` → crée une session avec boutons d’inscription',
      '`/sessions` → liste les prochaines sessions du serveur',
      '',
      '• Quand c’est complet, les suivants passent en **liste d’attente** et récupèrent une place si quelqu’un quitte.',
      `• Les inscrits reçoivent un **rappel ${REMINDER_MINUTES} minutes avant**.`,
      '• Seul l’organisateur (ou un modérateur) peut annuler.',
    ].join('\n'),
  },
  en: {
    'card.time': '🕘 Time',
    'card.slots': '👥 Slots',
    'card.full': 'full',
    'card.players': 'Players',
    'card.waitlist': '⏳ Waitlist',
    'card.footer': `Reminder ${REMINDER_MINUTES} min before start`,
    'card.cancelled': 'Session cancelled',
    'button.join': 'Join',
    'button.waitlist': 'Waitlist',
    'button.leave': 'Leave',
    'button.cancel': 'Cancel',
    'list.title': '📅 Upcoming sessions',
    'list.empty': 'No sessions planned. Start one with `/session`!',
    'reply.joined': '✅ You’re in!',
    'reply.waitlist': '⏳ It’s full: you’re on the waitlist.',
    'reply.left': 'You left the session.',
    'reply.cancelled': 'Session cancelled.',
    'reply.notOwner': 'Only the organizer or a moderator can cancel.',
    'reply.notFound': 'This session is over or could not be found.',
    'reply.badTime': 'Time not recognized. Examples: `9pm`, `9:30pm`, `21:30`, `in 30 min`.',
    'reply.guildOnly': 'This bot works inside a server.',
    'reply.error': 'Oops, something went wrong. Please try again in a moment.',
    'reason.cancelled': 'This session is cancelled.',
    'reason.alreadyJoined': 'You already joined.',
    'reason.alreadyWaitlist': 'You’re already on the waitlist.',
    'reason.notJoined': 'You haven’t joined this session.',
    'notice.promoted': '🎉 {user}, a spot opened up for **{game}**: you’re in!',
    'notice.reminder': '⏰ **{game}** starts {when}! {players}',
    help: [
      '**🎮 Sessions Bot — how to use**',
      '`/session game:Valorant time:9pm slots:5` → creates a session with sign-up buttons',
      '`/sessions` → lists the upcoming sessions on this server',
      '',
      '• When it’s full, extra players join the **waitlist** and get a spot if someone leaves.',
      `• Players get a **reminder ${REMINDER_MINUTES} minutes before**.`,
      '• Only the organizer (or a moderator) can cancel.',
    ].join('\n'),
  },
};

export const LANGUAGES = Object.keys(DICT);

/** Code de langue Discord ("fr", "en-US", "en-GB"...) → "fr" ou "en" */
export function langFrom(locale) {
  const forced = process.env.BOT_LANGUAGE;
  if (LANGUAGES.includes(forced)) return forced;
  return String(locale ?? '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function t(lang, key, vars = {}) {
  const text = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}
