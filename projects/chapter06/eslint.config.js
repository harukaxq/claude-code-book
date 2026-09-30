import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['.svelte-kit/**', 'build/**', 'data/**', 'drizzle/**', 'node_modules/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: tseslint.parser }
		}
	},
	{
		files: ['**/*.svelte.ts'],
		languageOptions: { parser: tseslint.parser }
	},
	{
		files: ['src/routes/**/*.ts', 'src/routes/**/*.svelte'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [{ name: 'drizzle-orm', message: 'ルートではサービスを呼び出してください。' }],
					patterns: [
						{
							group: ['$lib/server/db', '$lib/server/db/**'],
							message: 'ルートからDBを直接使わず、サービスを呼び出してください。'
						}
					]
				}
			]
		}
	},
	{
		files: ['src/lib/server/services/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@sveltejs/kit', '$app/**', '**/routes/**'],
							message: 'サービスはSvelteKitに依存させません。'
						}
					]
				}
			]
		}
	}
);
