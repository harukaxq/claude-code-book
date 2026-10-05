import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));

let child: ReturnType<typeof Bun.spawn> | undefined;
let stopping = false;
let started = false;

async function run(command: string[], quiet = false): Promise<void> {
	if (stopping) throw new Error('開発環境を停止しています。');
	const process = Bun.spawn(command, {
		stdin: 'inherit',
		stdout: quiet ? 'ignore' : 'inherit',
		stderr: quiet ? 'ignore' : 'inherit'
	});
	child = process;
	const code = await process.exited;
	child = undefined;
	if (code !== 0) throw new Error(`${command.join(' ')} に失敗しました (${code})。`);
}

function stop() {
	stopping = true;
	child?.kill();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

try {
	if (!Bun.which('docker'))
		throw new Error('Dockerが見つかりません。Dockerをインストールしてください。');
	await run(['docker', 'compose', 'version'], true);
	console.log('[1/5] SeaweedFSを起動します');
	started = true;
	await run(['docker', 'compose', 'up', '-d', 'seaweedfs']);

	console.log('[2/5] SeaweedFSのS3 APIを待っています');
	const deadline = Date.now() + 60_000;
	let ready = false;
	while (!stopping && Date.now() < deadline) {
		try {
			const response = await fetch('http://127.0.0.1:8333/', {
				signal: AbortSignal.timeout(1000)
			});
			await response.body?.cancel();
			if (response.status === 200 || response.status === 403) {
				ready = true;
				break;
			}
		} catch {
			// 起動中は接続できないため、再試行する。
		}
		await Bun.sleep(1000);
	}
	if (stopping) process.exitCode = 130;
	else {
		if (!ready) {
			await run(['docker', 'compose', 'logs', 'seaweedfs']);
			throw new Error('SeaweedFSのS3 APIが60秒以内に起動しませんでした。');
		}
		console.log('[3/5] SQLiteのマイグレーションを適用します');
		await run([process.execPath, 'scripts/migrate.ts']);
		console.log('[4/5] 初期データと商品画像を投入します');
		await run([process.execPath, 'scripts/seed.ts']);
		console.log('[5/5] TinyCommerceを起動します');
		console.log('Web: http://localhost:5173');
		console.log('Images: http://localhost:8333/tiny-commerce');
		process.env.PUBLIC_PRODUCT_IMAGE_BASE_URL = 'http://localhost:8333/tiny-commerce';
		await run([
			process.execPath,
			'--bun',
			'run',
			'vite',
			'dev',
			'--host',
			'127.0.0.1',
			...process.argv.slice(2)
		]);
	}
} catch (error) {
	if (!stopping) console.error(error instanceof Error ? error.message : error);
	process.exitCode = stopping ? 130 : 1;
} finally {
	if (started) {
		console.log('開発環境を停止しています...');
		const cleanup = Bun.spawn(['docker', 'compose', 'stop', 'seaweedfs'], {
			stdout: 'inherit',
			stderr: 'inherit'
		});
		if ((await cleanup.exited) !== 0) process.exitCode = 1;
	}
}
