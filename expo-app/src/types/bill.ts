// Domain types mirroring the Flutter `Bill` and `LocalUser` models.

export interface LocalUser {
  id: number;
  username: string;
}

export interface Bill {
  id?: number;
  title: string;
  amount: number;
  /** Category id, e.g. "electricity" | "water" | "internet" ... */
  category: string;
  /** ISO 8601 string (stored as TEXT in SQLite, like the Flutter app). */
  dueDate: string;
  isPaid: boolean;
  frontImagePath?: string | null;
  backImagePath?: string | null;
  userId: number;
}

/** Raw row shape as stored in / returned from SQLite. */
export interface BillRow {
  id: number;
  title: string;
  amount: number;
  category: string | null;
  dueDate: string;
  isPaid: number;
  frontImagePath: string | null;
  backImagePath: string | null;
  userId: number;
}

export function billFromRow(row: BillRow): Bill {
  return {
    id: row.id,
    title: row.title ?? 'Unknown Bill',
    amount: Number(row.amount) || 0,
    category: row.category ?? 'other',
    dueDate: row.dueDate,
    isPaid: row.isPaid === 1,
    frontImagePath: row.frontImagePath,
    backImagePath: row.backImagePath,
    userId: row.userId ?? 0,
  };
}
