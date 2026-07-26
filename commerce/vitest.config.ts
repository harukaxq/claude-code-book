import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		fileParallelism: false,
		include: ['src/**/*.test.ts'],
		setupFiles: ['./tests/setup.ts']
	},
	resolve: {
		alias: { $lib: new URL('./src/lib', import.meta.url).pathname }
	}
});
