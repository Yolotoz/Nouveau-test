// Logique pure des sessions (aucune dépendance à Discord) : facile à tester.

export const MAX_SLOTS = 50;
export const REMINDER_MINUTES = 10;

/**
 * Transforme une heure tapée par un humain en date.
 * Formats acceptés : "21h", "21h30", "21:30", "9h05", "dans 30 min", "30min".
 * Si l'heure est déjà passée aujourd'hui, on prend celle de demain.
 * @returns {Date|null}
 */
export function parseTime(input, now = new Date()) {
  const text = String(input).trim().toLowerCase().replace(/\s+/g, ' ');

  const relative = text.match(/^(?:dans )?(\d{1,3}) ?(?:min|mins|minutes?|m)$/);
  if (relative) {
    const minutes = Number(relative[1]);
    if (minutes < 1 || minutes > 24 * 60) return null;
    return new Date(now.getTime() + minutes * 60_000);
  }

  const clock = text.match(/^(\d{1,2}) ?(?:h|:) ?(\d{2})?$/);
  if (!clock) return null;
  const hours = Number(clock[1]);
  const minutes = clock[2] ? Number(clock[2]) : 0;
  if (hours > 23 || minutes > 59) return null;

  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

export function createSession({ id, guildId, channelId, creatorId, game, time, slots }) {
  return {
    id,
    guildId,
    channelId,
    messageId: null,
    creatorId,
    game: String(game).slice(0, 100),
    time: time.getTime(),
    slots: Math.min(Math.max(1, Math.floor(slots)), MAX_SLOTS),
    players: [creatorId],
    waitlist: [],
    reminded: false,
    cancelled: false,
  };
}

/** Inscrit un joueur ; s'il n'y a plus de place, il passe en liste d'attente. */
export function join(session, userId) {
  if (session.cancelled) return { ok: false, reason: 'Cette session est annulée.' };
  if (session.players.includes(userId)) return { ok: false, reason: 'Tu es déjà inscrit.' };
  if (session.waitlist.includes(userId)) return { ok: false, reason: "Tu es déjà en liste d'attente." };

  if (session.players.length < session.slots) {
    session.players.push(userId);
    return { ok: true, status: 'joined' };
  }
  session.waitlist.push(userId);
  return { ok: true, status: 'waitlist' };
}

/** Désinscrit un joueur ; le premier de la liste d'attente prend sa place. */
export function leave(session, userId) {
  const inPlayers = session.players.indexOf(userId);
  if (inPlayers !== -1) {
    session.players.splice(inPlayers, 1);
    const promoted = session.waitlist.shift() ?? null;
    if (promoted) session.players.push(promoted);
    return { ok: true, promoted };
  }
  const inWaitlist = session.waitlist.indexOf(userId);
  if (inWaitlist !== -1) {
    session.waitlist.splice(inWaitlist, 1);
    return { ok: true, promoted: null };
  }
  return { ok: false, reason: "Tu n'es pas inscrit." };
}

/** Sessions dont le rappel doit partir maintenant. */
export function dueForReminder(sessions, now = Date.now()) {
  return sessions.filter(
    (s) => !s.cancelled && !s.reminded && s.time - REMINDER_MINUTES * 60_000 <= now && s.time > now - 60_000,
  );
}

/** Sessions terminées depuis plus de 2 heures, à supprimer du stockage. */
export function expired(sessions, now = Date.now()) {
  return sessions.filter((s) => s.cancelled || s.time < now - 2 * 3_600_000);
}
