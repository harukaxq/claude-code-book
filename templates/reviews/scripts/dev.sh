#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
	echo "エラー: Dockerが見つかりません。Dockerをインストールしてから再実行してください。" >&2
	exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
	echo "エラー: Docker Composeが利用できません。" >&2
	exit 1
fi

cleanup() {
	echo
	echo "開発環境を停止しています..."
	docker compose stop seaweedfs >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[1/5] SeaweedFSを起動します"
docker compose up -d seaweedfs

echo "[2/5] SeaweedFSのS3 APIを待っています"
ready=false
for _ in $(seq 1 60); do
	status="$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:8333/ || true)"
	if [[ "$status" == "200" || "$status" == "403" ]]; then
		ready=true
		break
	fi
	sleep 1
done

if [[ "$ready" != "true" ]]; then
	echo "エラー: SeaweedFSのS3 APIが60秒以内に起動しませんでした。" >&2
	docker compose logs seaweedfs >&2 || true
	exit 1
fi

echo "[3/5] SQLiteのマイグレーションを適用します"
bunx drizzle-kit migrate

echo "[4/5] 初期データと商品画像を投入します"
bunx tsx scripts/seed.ts

echo "[5/5] TinyCommerceを起動します"
echo "Web: http://localhost:5173"
echo "Images: http://localhost:8333/tiny-commerce"
PUBLIC_PRODUCT_IMAGE_BASE_URL=http://localhost:8333/tiny-commerce \
	bunx vite dev --host 127.0.0.1
