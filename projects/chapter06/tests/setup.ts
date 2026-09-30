import { resolve } from 'node:path';

process.env.DATABASE_FILE = resolve(process.cwd(), 'data/tiny-commerce.test.db');
