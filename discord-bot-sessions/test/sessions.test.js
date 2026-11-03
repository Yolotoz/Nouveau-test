process.env.TZ = 'Europe/Paris';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, dueForReminder, expired, join, leave, parseTime } from '../src/sessions.js';
import { commands } from '../src/commands.js';
import { sessionMessage, listEmbed } from '../src/view.js';
import { langFrom, t } from '../src/i18n.js';

const now = new Date(2026, 10, 3, 18, 0, 0); // 3 nov. 2026, 18h00

test('parseTime : formats d’heure', () => {
  assert.equal(parseTime('21h', now).getHours(), 21);
  const t = parseTime('21h30', now);
  assert.deepEqual([t.getHours(), t.getMinutes(), t.getDate()], [21, 30, 3]);
  assert.equal(parseTime('21:30', now).getMinutes(), 30);
  assert.equal(parseTime(' 9H05 ', now).getMinutes(), 5);
});

test('parseTime : heure passée → lendemain', () => {
  const t = parseTime('10h', now);
  assert.deepEqual([t.getDate(), t.getHours()], [4, 10]);
});

test('parseTime : formats anglais', () => {
  const t9 = parseTime('9pm', now);
  assert.deepEqual([t9.getHours(), t9.getMinutes(), t9.getDate()], [21, 0, 3]);
  const t930 = parseTime('9:30 PM', now);
  assert.deepEqual([t930.getHours(), t930.getMinutes()], [21, 30]);
  assert.equal(parseTime('12am', now).getHours(), 0);
  assert.equal(parseTime('12pm', now).getHours(), 12);
  const morning = parseTime('10am', now);
  assert.deepEqual([morning.getDate(), morning.getHours()], [4, 10]); // déjà passé → demain
  assert.equal(parseTime('in 15 min', now).getTime() - now.getTime(), 15 * 60_000);
  assert.equal(parseTime('13pm', now), null);
  assert.equal(parseTime('0am', now), null);
});

test('parseTime : relatif', () => {
  assert.equal(parseTime('dans 30 min', now).getTime() - now.getTime(), 30 * 60_000);
  assert.equal(parseTime('45min', now).getTime() - now.getTime(), 45 * 60_000);
});

test('parseTime : entrées invalides', () => {
  for (const bad of ['', 'ce soir', '25h', '21h75', '0 min', 'abc']) {
    assert.equal(parseTime(bad, now), null, bad);
  }
});

const newSession = (slots = 2) =>
  createSession({ id: 's1', guildId: 'g', channelId: 'c', creatorId: 'A', game: 'Valorant', time: parseTime('21h', now), slots });

test('inscription, complet, liste d’attente, promotion', () => {
  const s = newSession(2);
  assert.deepEqual(s.players, ['A']);
  assert.equal(join(s, 'B').status, 'joined');
  assert.equal(join(s, 'B').reason, 'alreadyJoined');
  assert.equal(join(s, 'C').status, 'waitlist');
  assert.equal(join(s, 'C').reason, 'alreadyWaitlist');
  assert.equal(leave(s, 'B').promoted, 'C');
  assert.deepEqual(s.players, ['A', 'C']);
  assert.deepEqual(s.waitlist, []);
  assert.equal(leave(s, 'Z').reason, 'notJoined');
});

test('session annulée : plus d’inscriptions', () => {
  const s = newSession();
  s.cancelled = true;
  assert.equal(join(s, 'B').reason, 'cancelled');
});

test('rappels et expiration', () => {
  const s = newSession();
  assert.equal(dueForReminder([s], s.time - 20 * 60_000).length, 0);
  assert.equal(dueForReminder([s], s.time - 5 * 60_000).length, 1);
  s.reminded = true;
  assert.equal(dueForReminder([s], s.time - 5 * 60_000).length, 0);
  assert.equal(expired([s], s.time + 60_000).length, 0);
  assert.equal(expired([s], s.time + 3 * 3_600_000).length, 1);
});

test('commandes et messages Discord valides', () => {
  assert.deepEqual(commands.map((c) => c.name), ['session', 'sessions', 'help']);
  assert.equal(commands[2].name_localizations.fr, 'aide');
  assert.deepEqual(commands[0].options.map((o) => o.name_localizations?.fr ?? o.name), ['jeu', 'heure', 'places', 'note']);

  const s = newSession(5);
  const message = sessionMessage(s);
  assert.equal(message.embeds[0].toJSON().title, '🎮 Valorant');
  assert.equal(message.components[0].toJSON().components.length, 3);
  assert.ok(listEmbed([], 'fr').toJSON().description.includes('/session'));
});

test('langue : détection et traductions', () => {
  assert.equal(langFrom('fr'), 'fr');
  assert.equal(langFrom('en-US'), 'en');
  assert.equal(langFrom('de'), 'en');
  assert.equal(langFrom(undefined), 'en');

  const fr = createSession({ id: 'a', guildId: 'g', channelId: 'c', creatorId: 'A', game: 'Fortnite', time: now, slots: 2, lang: 'fr' });
  const en = { ...fr, lang: 'en' };
  const label = (session) => sessionMessage(session).components[0].toJSON().components[0].label;
  assert.equal(label(fr), 'Rejoindre');
  assert.equal(label(en), 'Join');
  assert.equal(sessionMessage(en).embeds[0].toJSON().fields[0].name, '🕘 Time');
  assert.equal(t('en', 'notice.reminder', { game: 'X', when: 'soon', players: '@A' }), '⏰ **X** starts soon! @A');
  assert.equal(t('fr', 'reason.notJoined'), "Tu n'es pas inscrit.");

  // Une ancienne session sans langue reste en français
  const old = { ...fr };
  delete old.lang;
  assert.equal(label(old), 'Rejoindre');
});
