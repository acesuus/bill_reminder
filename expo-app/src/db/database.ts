// Offline-first local persistence using expo-sqlite.
// This is the React Native equivalent of the Flutter `DatabaseHelper`.
// All data lives on the device; no network is ever required.

import * as SQLite from 'expo-sqlite';
import { Bill, BillRow, billFromRow } from '@/types/bill';

const DB_NAME = 'bill_reminder.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Lazily open the database and ensure the schema exists (singleton). */
function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL DEFAULT '',
          password TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS bills (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          dueDate TEXT NOT NULL,
          isPaid INTEGER NOT NULL DEFAULT 0,
          frontImagePath TEXT,
          backImagePath TEXT,
          userId INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

// --- User methods ---

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
}

export async function insertUser(username: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    username,
    '',
    ''
  );
  return result.lastInsertRowId;
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserRow>(
    'SELECT * FROM users WHERE username = ?',
    username
  );
  return row ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ?? null;
}

// --- Bill methods ---

export async function insertBill(bill: Bill): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO bills
      (title, amount, dueDate, isPaid, frontImagePath, backImagePath, userId)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    bill.title,
    bill.amount,
    bill.dueDate,
    bill.isPaid ? 1 : 0,
    bill.frontImagePath ?? null,
    bill.backImagePath ?? null,
    bill.userId
  );
  return result.lastInsertRowId;
}

export async function getBillById(id: number): Promise<Bill | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BillRow>('SELECT * FROM bills WHERE id = ?', id);
  return row ? billFromRow(row) : null;
}

export async function getBillsByUserId(userId: number): Promise<Bill[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BillRow>(
    'SELECT * FROM bills WHERE userId = ? ORDER BY dueDate ASC',
    userId
  );
  return rows.map(billFromRow);
}

export async function updateBill(bill: Bill): Promise<number> {
  if (bill.id == null) return 0;
  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE bills SET
      title = ?, amount = ?, dueDate = ?, isPaid = ?,
      frontImagePath = ?, backImagePath = ?, userId = ?
     WHERE id = ?`,
    bill.title,
    bill.amount,
    bill.dueDate,
    bill.isPaid ? 1 : 0,
    bill.frontImagePath ?? null,
    bill.backImagePath ?? null,
    bill.userId,
    bill.id
  );
  return result.changes;
}

export async function deleteBill(id: number): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync('DELETE FROM bills WHERE id = ?', id);
  return result.changes;
}
