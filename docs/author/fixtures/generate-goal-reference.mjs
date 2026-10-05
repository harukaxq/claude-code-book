// 著者のみ: bun generate-goal-reference.mjs <隔離した第8章コピーの絶対パス>
// このファイルとgoal-completed/を同じフォルダに置く。
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { access, writeFile } from 'node:fs/promises';
const project = resolve(process.argv[2]);
const target = resolve(project, 'goal/reference.png');
try { await access(target); throw new Error('基準画像は既にあります。上書きしません。'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const require = createRequire(resolve(project, 'package.json'));
const { chromium } = await import(pathToFileURL(require.resolve('playwright')).href);
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage({viewport:{width:280,height:720},deviceScaleFactor:1,locale:'en-US',timezoneId:'UTC',colorScheme:'light',reducedMotion:'reduce'});
 await page.goto(new URL('./goal-completed/index.html',import.meta.url).href);
 await page.evaluate(async()=>{await document.fonts.ready;});
 await page.screenshot({path:target,animations:'disabled',fullPage:false});
 await writeFile(resolve(project,'goal/reference-environment.json'),JSON.stringify({browser:browser.version(),platform:process.platform,viewport:[280,720],dpr:1},null,2)+'\n');
 console.log(target);
} finally {await browser.close();}
