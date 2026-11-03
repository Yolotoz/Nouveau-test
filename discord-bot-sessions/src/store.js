// Stockage très simple dans un fichier JSON : les sessions survivent
// à un redémarrage du bot. Suffisant pour quelques centaines de serveurs ;
// au-delà, on passera à une vraie base de données (SQLite, PostgreSQL...).

import fs from 'node:fs';
import path from 'node:path';

export class SessionStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.sessions = new Map();
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      for (const session of JSON.parse(raw)) this.sessions.set(session.id, session);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('[store] Lecture impossible :', error.message);
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify([...this.sessions.values()], null, 2));
    fs.renameSync(tmp, this.filePath); // écriture atomique : pas de fichier corrompu
  }

  get(id) {
    return this.sessions.get(id);
  }

  set(session) {
    this.sessions.set(session.id, session);
    this.save();
  }

  delete(id) {
    this.sessions.delete(id);
    this.save();
  }

  all() {
    return [...this.sessions.values()];
  }

  upcomingInGuild(guildId, now = Date.now()) {
    return this.all()
      .filter((s) => s.guildId === guildId && !s.cancelled && s.time > now - 3_600_000)
      .sort((a, b) => a.time - b.time);
  }
}
