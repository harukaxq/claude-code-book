import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const databaseFile = resolve(process.cwd(), process.env.DATABASE_FILE ?? 'data/tiny-commerce.db');
mkdirSync(dirname(databaseFile), { recursive: true });

export const sqlite = new Database(databaseFile);
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
