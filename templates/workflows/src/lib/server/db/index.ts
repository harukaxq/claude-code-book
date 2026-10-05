import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const databaseFile = resolve(process.cwd(), process.env.DATABASE_FILE ?? 'data/tiny-commerce.db');
mkdirSync(dirname(databaseFile), { recursive: true });

export const sqlite = new Database(databaseFile);
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec('PRAGMA journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
