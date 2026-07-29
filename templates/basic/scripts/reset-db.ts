import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseFile = resolve(process.cwd(), process.env.DATABASE_FILE ?? 'data/tiny-commerce.db');

function run(command: string[], quiet = false) {
	const result = Bun.spawnSync(command, {
		cwd: process.cwd(),
		stdout: quiet ? 'pipe' : 'inherit',
		stderr: quiet ? 'pipe' : 'inherit'
	});
	if (result.exitCode !== 0) throw new Error(`${command.join(' ')} に失敗しました。`);
	return result;
}

async function isWebRunning(): Promise<boolean> {
	try {
		await fetch('http://127.0.0.1:5173', { signal: AbortSignal.timeout(500) });
		return true;
	} catch {
		return false;
	}
}

async function waitForSeaweedFS(): Promise<void> {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const response = await fetch('http://127.0.0.1:8333', {
				signal: AbortSignal.timeout(1000)
			});
			if (response.status === 200 || response.status === 403) return;
		} catch {
			// 起動中は接続できないため、1秒待って再試行する。
		}
		await Bun.sleep(1000);
	}
	throw new Error('SeaweedFSのS3 APIが60秒以内に起動しませんでした。');
}

if (await isWebRunning()) {
	console.error('開発サーバーが起動中です。先にCtrl+Cで停止してから、もう一度実行してください。');
	process.exit(1);
}

const runningServices = run(['docker', 'compose', 'ps', '--status', 'running', '--services'], true)
	.stdout.toString()
	.trim()
	.split('\n');
const seaweedWasRunning = runningServices.includes('seaweedfs');

try {
	if (!seaweedWasRunning) {
		console.log('SeaweedFSを起動します。');
		run(['docker', 'compose', 'up', '-d', 'seaweedfs']);
	}
	await waitForSeaweedFS();

	for (const file of [databaseFile, `${databaseFile}-shm`, `${databaseFile}-wal`]) {
		if (existsSync(file)) rmSync(file);
	}

	console.log('SQLiteデータベースを削除しました。マイグレーションを適用します。');
	run(['bunx', 'drizzle-kit', 'migrate']);
	run(['bunx', 'tsx', 'scripts/seed.ts']);
	console.log('初期状態へのリセットが完了しました。');
} finally {
	if (!seaweedWasRunning) run(['docker', 'compose', 'stop', 'seaweedfs']);
}
