// Base de données SQLite (intégrée à Node.js, aucun logiciel à installer).

import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const toBooking = (row) => ({
  id: row.id,
  serviceId: row.service_id,
  date: row.date,
  start: row.start,
  end: row.end,
  name: row.name,
  phone: row.phone,
  status: row.status,
  createdAt: row.created_at,
});

export function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start INTEGER NOT NULL,
      end INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (date, status);
  `);

  const stmts = {
    forDate: db.prepare(`SELECT * FROM bookings WHERE date = ? AND status = 'confirmed' ORDER BY start`),
    insert: db.prepare(
      `INSERT INTO bookings (id, service_id, date, start, end, name, phone, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
    ),
    from: db.prepare(`SELECT * FROM bookings WHERE date >= ? ORDER BY date, start`),
    cancel: db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'`),
  };

  return {
    bookingsForDate(date) {
      return stmts.forDate.all(date).map(toBooking);
    },
    insertBooking(b) {
      const booking = { ...b, id: randomUUID(), status: 'confirmed', createdAt: new Date().toISOString() };
      stmts.insert.run(booking.id, b.serviceId, b.date, b.start, b.end, b.name, b.phone, booking.createdAt);
      return booking;
    },
    bookingsFrom(date) {
      return stmts.from.all(date).map(toBooking);
    },
    cancelBooking(id) {
      return stmts.cancel.run(id).changes > 0;
    },
    close() {
      db.close();
    },
  };
}
