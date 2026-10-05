import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'artifacts/goal');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
	const page = await browser.newPage({
		viewport: { width: 280, height: 720 },
		deviceScaleFactor: 1,
		locale: 'en-US',
		timezoneId: 'UTC',
		colorScheme: 'light',
		reducedMotion: 'reduce'
	});
	await page.goto(new URL('../goal/index.html', import.meta.url).href);
	await page.evaluate(async () => {
		await document.fonts.ready;
	});
	await page.screenshot({
		path: resolve(output, 'current.png'),
		animations: 'disabled',
		fullPage: false
	});
	const reference = PNG.sync.read(await readFile(resolve(root, 'goal/reference.png')));
	const current = PNG.sync.read(await readFile(resolve(output, 'current.png')));
	if (
		reference.width !== 280 ||
		reference.height !== 720 ||
		current.width !== 280 ||
		current.height !== 720
	)
		throw new Error('Expected 280x720 images');
	const diff = new PNG({ width: 280, height: 720 });
	const pixels = pixelmatch(reference.data, current.data, diff.data, 280, 720, {
		threshold: 0.1,
		includeAA: true
	});
	const percent = (pixels / (280 * 720)) * 100;
	const result = {
		browser: browser.version(),
		platform: process.platform,
		viewport: [280, 720],
		dpr: 1,
		threshold: 0.1,
		includeAA: true,
		differentPixels: pixels,
		totalPixels: 201600,
		percent,
		limitPercent: 1,
		passed: percent <= 1
	};
	await writeFile(resolve(output, 'diff.png'), PNG.sync.write(diff));
	await writeFile(resolve(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
	console.log(JSON.stringify(result, null, 2));
	console.log('Output: ' + output);
	process.exitCode = result.passed ? 0 : 1;
} finally {
	await browser.close();
}
