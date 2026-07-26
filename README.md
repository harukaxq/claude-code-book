# TinyCommerce

TinyCommerceは、SvelteKitで作った小さなECアプリです。商品をカートへ入れ、固定額クーポンを使って注文できます。商品・クーポン・注文を確認する管理画面も含みます。

このリポジトリは、SvelteKitの画面からサービス、Drizzle ORM、SQLiteへ処理が流れる様子を追いやすいように、意図的に小さな構成にしています。

## 必要なもの

- [Bun](https://bun.sh/) 1.3以降
- DockerとDocker Compose

## 起動する

初回だけ依存パッケージをインストールします。

```bash
cd commerce
bun install
cd ..
```

以降はリポジトリ直下で、次のコマンドだけを実行します。

```bash
bun run dev
```

このコマンドはSeaweedFSの起動、SQLiteのマイグレーション、初期データと画像の投入、SvelteKitの起動を順番に行います。`.env`の作成は不要です。

- ショップ: <http://localhost:5173>
- 管理画面: <http://localhost:5173/admin/products>
- 商品画像: SeaweedFSの <http://localhost:8333/tiny-commerce>

終了するときは、起動したターミナルで `Ctrl+C` を押します。コンテナは停止しますが、SQLiteとSeaweedFSのデータは残ります。

## 主な操作

購入者側では、商品をカートに追加し、数量やクーポンを設定して注文できます。初期クーポンは次の2つです。

- `SMALL100`: 条件なしで100円引き
- `WELCOME500`: 商品小計3,000円以上で500円引き

管理画面では、次のURLからデータを管理できます。認証はありません。

- `/admin/products`: 商品、在庫、公開状態
- `/admin/coupons`: 固定額クーポン
- `/admin/orders`: 注文と注文明細

## コードを読む順番

注文金額の計算を例にすると、次の順番で読むと処理を追えます。

1. `src/routes/cart/+page.svelte` がカート操作を受け取る
2. `src/lib/cart.svelte.ts` が `POST /api/cart/calculate` を呼ぶ
3. `src/routes/api/cart/calculate/+server.ts` がJSONをZodで検証する
4. `src/lib/server/services/checkout.ts` がDBから商品を取得して金額を計算する
5. `src/lib/server/db/schema.ts` がテーブルを定義する

`+page.server.ts` と `+server.ts` はHTTPやフォームを扱う場所です。ここからDrizzleを直接呼ばず、意味のある引数をサービスへ渡します。サービスはSvelteKitの `Request` や `FormData` を受け取りません。

## ディレクトリ

```text
samples/products/             シードに使う商品画像
commerce/
├── scripts/                  起動、シード、DBリセット
├── drizzle/                  SQLiteマイグレーション
├── src/lib/cart.svelte.ts    localStorageを使うカート
├── src/lib/server/db/        Drizzleの接続とテーブル
├── src/lib/server/services/  商品、クーポン、注文の処理
└── src/routes/               SvelteKitの画面とAPI
```

## 開発用コマンド

リポジトリ直下から実行できます。

```bash
bun run check     # SvelteとTypeScriptの検査
bun run lint      # ESLint（層をまたぐ不正なimportも検査）
bun run test      # 金額計算と注文サービスのテスト
bun run build     # 本番向けビルド
bun run reset:db  # SQLiteを初期状態へ戻す（開発サーバーは先に停止）
```

詳しい要件は [`commerce/docs/spec.md`](commerce/docs/spec.md) にあります。
