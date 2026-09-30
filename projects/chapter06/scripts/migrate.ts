import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db, sqlite } from '../src/lib/server/db';

try {
	migrate(db, { migrationsFolder: './drizzle' });
} finally {
	sqlite.close();
}
