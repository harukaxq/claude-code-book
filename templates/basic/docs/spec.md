# TinyCommerce 仕様書

## 1. 概要

TinyCommerceは、デスク周辺用品を販売する小規模なECアプリケーションである。

購入者は商品をカートへ追加し、固定額クーポンを適用して注文できる。運営者は商品、クーポン、注文を管理できる。

購入者は固定のデモユーザーとする。購入者向け画面と管理画面のどちらにも認証は設けない。

## 2. 対象範囲

### 2.1 購入者向け機能

- 商品一覧の表示
- 商品のカート追加
- カート内の数量変更と商品削除
- 固定額クーポンの適用
- 注文金額の計算
- 注文確認
- 注文確定
- 注文完了内容の表示

### 2.2 運営者向け機能

- 商品の一覧、登録、編集
- 在庫数の変更
- 商品の公開、非公開の切り替え
- 固定額クーポンの一覧、登録、編集
- クーポンの有効、無効の切り替え
- 注文の一覧と詳細表示

### 2.3 対象外

- 本物の決済
- 会員登録、ログイン認証
- 住所入力
- 配送業者との連携
- メール送信
- 複数店舗、複数通貨
- 消費税計算
- ポイント
- 返品、返金
- パーセント割引クーポン
- キャンペーンによる自動割引
- 本格的な在庫競合制御

## 3. 画面

### 3.1 商品一覧 `/`

公開中の商品を一覧表示する。

表示内容：

- 商品名
- 商品画像
- 商品説明
- カテゴリ
- 税込価格
- 在庫状態
- カート追加ボタン

在庫状態は次のように表示する。

- 在庫が1個以上：`在庫あり`
- 在庫が0個：`在庫切れ`

在庫切れの商品ではカート追加ボタンを無効にする。非公開商品は表示しない。

商品詳細画面は作らない。

### 3.2 カート `/cart`

表示内容：

- 商品名
- 単価
- 数量
- 商品ごとの小計
- 商品小計
- クーポン割引
- 送料
- 支払合計

操作：

- 数量変更
- 商品削除
- クーポンコード入力
- 注文確認画面への遷移

カートの内容が変わった場合は、サーバーへ金額計算を要求して表示を更新する。

### 3.3 注文確認 `/checkout`

表示内容：

- 注文商品
- 適用されたクーポン
- 商品小計
- クーポン割引
- 送料
- 支払合計
- 注文確定ボタン

注文確定時に本物の決済は行わない。

### 3.4 注文完了 `/orders/:orderId`

表示内容：

- 注文番号
- 注文日時
- 商品名
- 注文時の単価
- 数量
- 商品ごとの小計
- 適用されたクーポン
- 商品小計
- クーポン割引
- 送料
- 支払合計

### 3.5 商品管理 `/admin/products`

- 商品一覧
- 商品登録
- 商品編集
- 在庫変更
- 公開、非公開の切り替え

### 3.6 クーポン管理 `/admin/coupons`

- クーポン一覧
- 固定額クーポンの登録
- クーポン編集
- 有効、無効の切り替え

### 3.7 注文管理 `/admin/orders`

一覧表示：

- 注文番号
- 注文日時
- 商品数
- 支払合計
- 適用クーポン
- 注文詳細へのリンク

注文詳細では、購入者向けの注文完了画面と同等の内容を表示する。

## 4. データ

### 4.1 Product

```ts
type ProductCategory = 'desk' | 'stationery' | 'accessory';

type Product = {
	id: string;
	name: string;
	description: string;
	imageKey: string;
	category: ProductCategory;
	price: number;
	stock: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};
```

- `price`は税込価格を円単位の整数で保持する
- `stock`は0以上の整数とする
- `imageKey`はSeaweedFSのオブジェクトキーとし、`products/<ファイル名>`形式とする
- 初期商品の画像はアプリルートの`samples/products/`を原本とする
- シード時に画像をSeaweedFSへアップロードする

### 4.2 CartItem

```ts
type CartItem = {
	productId: string;
	quantity: number;
};
```

カートには商品名、価格、在庫、割引額、合計金額を保存しない。

### 4.3 Coupon

```ts
type Coupon = {
	id: string;
	code: string;
	discountAmount: number;
	minimumSubtotal: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};
```

- `code`は一意とする
- `discountAmount`は円単位の正の整数とする
- `minimumSubtotal`は円単位の0以上の整数とする

### 4.4 Order

```ts
type Order = {
	id: string;
	customerId: string;
	subtotal: number;
	couponDiscount: number;
	shippingFee: number;
	total: number;
	couponCode: string | null;
	createdAt: string;
};
```

### 4.5 OrderItem

```ts
type OrderItem = {
	id: string;
	orderId: string;
	productId: string;
	productName: string;
	unitPrice: number;
	quantity: number;
	lineSubtotal: number;
};
```

注文時点の商品名と価格を保存する。注文後に商品情報が変更されても、過去の注文内容は変更しない。

### 4.6 商品画像

商品画像はSeaweedFSのS3互換APIへ保存する。

- バケット名は`tiny-commerce`とする
- オブジェクトキーは`products/<ファイル名>`とする
- 初期画像の原本はアプリルートの`samples/products/`へ保存する
- `samples/`はシードの入力専用とし、Viteから直接配信しない
- データベースにはSeaweedFSの接続先や完全なURLを保存しない
- ブラウザはSeaweedFSの公開URLから画像を直接取得する
- 画像URLは`PUBLIC_PRODUCT_IMAGE_BASE_URL`と`imageKey`を組み合わせて作る
- 開発環境の`PUBLIC_PRODUCT_IMAGE_BASE_URL`は`http://localhost:8333/tiny-commerce`とする
- 画像表示は通常の`img`要素で行い、ブラウザから画像を`fetch`しない

アプリケーション本体に商品画像を中継するルートや、画像取得用のサービスは作らない。AWS SDKのS3クライアントは、初期画像をアップロードするシード処理でだけ使用する。

## 5. カート

カートはブラウザのlocalStorageへ保存する。

```ts
type StoredCart = {
	version: 1;
	items: CartItem[];
	couponCode: string | null;
};
```

- localStorageのキーは`tiny-commerce.cart.v1`とする
- localStorageの読み書きはブラウザ側だけで行う
- 同じ商品を追加した場合は数量を加算する
- 同じ`productId`を持つ明細を複数保存しない
- 注文が成功した場合だけカートを空にする
- 保存データが不正な場合は空のカートとして扱う

カートの状態と操作は`src/lib/cart.svelte.ts`の1ファイルにまとめる。Svelte 5のrunesを使い、カートの内容を`$state`で保持する。このファイルは次を担当する。

- カートで使用する型
- localStorageからの復元と保存
- 商品の追加、削除、数量変更
- クーポンコードの設定
- 金額計算APIの呼び出しと計算結果の保持
- 注文成功後のカート初期化

localStorageへのアクセスはブラウザ上でのみ実行し、SSR中には行わない。

金額計算と注文確定時には、商品ID、数量、クーポンコードだけをサーバーへ送る。サーバーは現在の商品情報とクーポン情報をデータベースから取得する。

## 6. 金額計算

### 6.1 共通ルール

- 金額はすべて円単位の整数とする
- 商品価格は税込価格とする
- 1回の注文で利用できるクーポンは1件とする
- クーポンは送料へ適用しない
- 割引後の商品金額を0円未満にしない
- カートの金額計算時と注文確定時は、サーバー側の同じ計算処理を使用する
- 注文確定時は金額を再計算し、ブラウザから送られた価格や計算結果を信用しない

計算順序：

```text
商品小計
↓
クーポン割引
↓
送料加算
↓
支払合計
```

### 6.2 商品小計

```text
明細小計 = 単価 × 数量
商品小計 = すべての明細小計の合計
```

### 6.3 クーポン割引

次の条件をすべて満たす場合だけクーポンを適用する。

- クーポンコードが存在する
- クーポンが有効である
- 商品小計が最低購入金額以上である

```text
クーポン割引額 = min（設定された割引額, 商品小計）
```

クーポンコードが存在しない、無効、または最低購入金額未満の場合は割引せず、計算結果へ理由を警告として含める。注文自体は続行できる。

### 6.4 送料と支払合計

- 商品小計が5,000円以上なら送料無料
- 商品小計が5,000円未満なら送料500円
- クーポン割引は送料無料判定に影響しない

```text
支払合計 = 商品小計 - クーポン割引額 + 送料
```

## 7. 在庫と注文

- カートと注文の数量は1以上10以下の整数とする
- 同じ商品IDを1回のリクエストに複数含めない
- 在庫数を超える注文は確定できない
- 非公開商品は新しくカートへ追加できない
- カート追加後に商品が非公開になった場合、注文を確定できない
- 注文確定時に在庫を減らす
- 注文保存と在庫更新は同じSQLiteトランザクションで処理する
- 空のカートは注文できない

同時注文による高度な競合制御は扱わない。

## 8. サーバーインターフェース

### 8.1 SvelteKitのページ処理

次の処理は各画面の`+page.server.ts`からサービスを呼び出す。

- 商品一覧の取得
- 注文完了画面の注文取得
- 管理画面の商品、クーポン、注文の取得
- 管理画面の商品、クーポンの登録と編集

読み取りは`load`、登録と編集はform actionsを使用する。管理画面専用のJSON APIは作らない。

### 8.2 カート金額計算API

```text
POST /api/cart/calculate
```

リクエスト：

```ts
type CartCalculationRequest = {
	items: CartItem[];
	couponCode?: string;
};
```

レスポンス：

```ts
type CartSummaryItem = {
	productId: string;
	productName: string;
	unitPrice: number;
	quantity: number;
	lineSubtotal: number;
};

type AppliedCoupon = {
	code: string;
	discountAmount: number;
};

type CartSummary = {
	items: CartSummaryItem[];
	subtotal: number;
	couponDiscount: number;
	shippingFee: number;
	total: number;
	appliedCoupon: AppliedCoupon | null;
	warnings: string[];
};
```

### 8.3 注文API

```text
POST /api/orders
```

リクエスト：

```ts
type OrderRequest = {
	items: CartItem[];
	couponCode?: string;
};
```

レスポンス：

```ts
type OrderResponse = {
	orderId: string;
};
```

注文APIは固定デモユーザーとして注文を作成する。ブラウザから金額や`CartSummary`は受け取らず、サーバー側で再計算する。注文確定後、クライアントは`/orders/:orderId`へ遷移する。

### 8.4 エラー

- JSON形式または入力値が不正：`400 Bad Request`
- 注文対象の商品が存在しない、非公開、在庫不足：`409 Conflict`
- 注文が存在しない：`404 Not Found`
- 想定外のサーバーエラー：`500 Internal Server Error`

クーポンを適用できないことは注文全体のエラーにせず、計算結果の`warnings`で通知する。

## 9. 技術構成

- TypeScript
- SvelteKit（Svelte 5のrunesを使用）
- Webとサーバーを分離しない単一アプリ
- Drizzle ORM
- SQLite
- SeaweedFS
- AWS SDK for JavaScriptのS3クライアント
- Zod
- localStorage

`features`パッケージ、Repository、Port/Adapter、DIコンテナは導入しない。

### 9.1 プレゼンテーション層

`+page.server.ts`と`+server.ts`をプレゼンテーション層として扱う。

責務：

- `Request`、`FormData`、URLパラメータを読み取る
- Zodで外部入力を検証する
- 固定デモユーザーや現在日時を用意する
- 検証済みの値をサービスへ渡す
- サービスの結果をページデータまたはHTTPレスポンスへ変換する
- サービスの業務エラーをHTTPステータスや画面表示へ変換する

Drizzle、DB接続、金額計算、在庫判定は直接扱わない。

### 9.2 サービス層

サービスはSvelteKitに依存しないTypeScript関数として実装し、Drizzleを直接利用する。

```ts
async function calculateCart(items: CartItem[], couponCode: string | null): Promise<CartSummary>;

async function placeOrder(
	customerId: string,
	items: CartItem[],
	couponCode: string | null,
	orderedAt: Date
): Promise<{ orderId: string }>;
```

サービスへ次の値や型は渡さない。

- `Request`
- `RequestEvent`
- `FormData`
- `URLSearchParams`
- SvelteKitの`error`、`redirect`、`json`
- HTTPステータスコード
- Zodスキーマそのもの

商品登録のように関連する項目が多い場合は、検証済みのプレーンオブジェクトを1引数としてよい。

`src/lib/server/services/checkout.ts`内にDBへ依存しない`calculateTotals`関数を置き、`calculateCart`と`placeOrder`から共通利用する。独立した`pricing/`ディレクトリは作らない。

```ts
type CartProduct = {
	productId: string;
	productName: string;
	unitPrice: number;
	quantity: number;
};

function calculateTotals(items: CartProduct[], coupon: Coupon | null): CartSummary;
```

DBアクセスと計算は、同じファイル内でも「データ取得 → 計算 → 保存」の順で分けて記述する。

### 9.3 依存方向

```text
src/routes/**/+page.server.ts
src/routes/**/+server.ts
          ↓
src/lib/server/services/*.ts
          ↓
src/lib/server/db/*.ts
```

次の依存を禁止する。

- `src/routes/**`から`drizzle-orm`をimportする
- `src/routes/**`から`$lib/server/db/**`を直接importする
- `src/lib/server/services/**`から`@sveltejs/kit`をimportする
- `src/lib/server/services/**`から`$app/*`をimportする
- `src/lib/server/services/**`から`src/routes/**`をimportする
- ブラウザ側コードから`src/lib/server/**`をimportする

ESLintの`no-restricted-imports`などで、可能な範囲を機械的に検査する。Lintのエラーには修正方針を含める。

### 9.4 オブジェクトストレージ

SeaweedFSはDocker Composeで単一ノードの開発環境として起動し、S3互換APIを使用する。

- Dockerイメージは`chrislusf/seaweedfs:4.29`を使用する
- `weed mini`相当の構成で起動する
- Docker Composeにhealthcheckを定義する
- S3エンドポイントは`http://127.0.0.1:8333`とする
- Docker Composeのポートは`127.0.0.1:8333:8333`とし、ローカルホスト以外へ公開しない
- バケット名は`tiny-commerce`とする
- AWSリージョンは`us-east-1`とする
- path-styleアクセスを使用する
- ローカル開発ではSeaweedFSの匿名アクセスを許可する
- ブラウザは公開URLを`img`要素の`src`に指定し、SeaweedFSから直接画像を取得する
- アプリケーションからSeaweedFSへ書き込むのはシード処理だけとする
- データはDockerのnamed volumeへ保存し、通常の停止では削除しない
- ブラウザへ認証情報は渡さない

ローカル開発に必要な値には既定値を用意し、初回起動のための`.env`作成を必須にしない。`scripts/dev.sh`は`PUBLIC_PRODUCT_IMAGE_BASE_URL=http://localhost:8333/tiny-commerce`をViteへ渡す。

### 9.5 開発環境の起動

アプリルートで次のコマンドを実行するだけで、開発に必要な環境が起動するようにする。

```bash
bun run dev
```

アプリルートの`package.json`の`dev`は`scripts/dev.sh`を実行する。`scripts/dev.sh`は次の順序で処理する。

1. DockerとDocker Composeを利用できることを確認する
2. `docker compose up -d seaweedfs`でSeaweedFSを起動する
3. S3互換APIでバケットを確認できるまで、上限時間を設けて待機する
4. DrizzleのマイグレーションをSQLiteへ適用する
5. シード処理を実行し、初期データを登録して画像をSeaweedFSへアップロードする
6. すべて成功した後にViteの開発サーバーを起動する

起動処理には次の性質を持たせる。

- ViteはSeaweedFS、マイグレーション、シードの準備完了後にだけ起動する
- SeaweedFSが上限時間内に利用可能にならない場合は、理由を表示して終了する
- 初期データに必要な画像が`samples/products/`に足りない場合は、不足ファイルを表示して終了する
- シードは固定IDを使ったupsertと同じオブジェクトキーへの上書きにより冪等にする
- `bun run dev`を繰り返しても商品やクーポンが重複しない
- 通常の起動では既存のSQLiteデータやSeaweedFSのデータを消去しない
- `Ctrl+C`ではViteを終了し、このプロジェクトのDocker Composeコンテナを停止する
- Vite、Docker、マイグレーション、シードの出力を同じターミナルで確認できるようにする

## 10. ディレクトリ構成

```text
<app-root>/
├── samples/
│   └── products/                         # 初期商品画像の原本
│       ├── mini-notebook.webp
│       ├── cable-holder.webp
│       ├── desk-mat.webp
│       ├── mechanical-keyboard.webp
│       └── monitor-stand.webp
├── data/                                 # SQLiteデータベース
├── drizzle/                              # SQLマイグレーション
├── scripts/
│   ├── dev.sh                            # 開発環境全体の起動
│   ├── seed.ts                           # DB登録とSeaweedFSへの画像投入
│   └── reset-db.ts
├── src/
│   ├── lib/
│   │   ├── cart.svelte.ts                # runes、localStorage、API呼び出し
│   │   ├── components/                   # 複数画面で共有するUI
│   │   └── server/
│   │       ├── db/
│   │       │   ├── index.ts
│   │       │   └── schema.ts
│   │       └── services/
│   │           ├── products.ts
│   │           ├── coupons.ts
│   │           ├── checkout.ts
│   │           ├── checkout.test.ts
│   │           └── orders.ts
│   └── routes/
│       ├── +page.server.ts
│       ├── +page.svelte
│       ├── cart/+page.svelte
│       ├── checkout/+page.svelte
│       ├── orders/[orderId]/
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       ├── admin/
│       │   ├── products/
│       │   ├── coupons/
│       │   └── orders/
│       └── api/
│           ├── cart/calculate/+server.ts
│           └── orders/+server.ts
├── tests/
│   └── e2e/
├── docker-compose.yml                    # SeaweedFS
├── drizzle.config.ts
└── package.json
```

カートのためのディレクトリや、汎用的な`types.ts`は作らない。型はその型を主に使うファイルに置く。`cart.svelte.ts`はブラウザ側のモジュールとし、サービスからimportしない。

特定の画面だけで使うSvelteコンポーネントは、その画面のルートディレクトリへ置く。`src/lib/components/`には複数画面で共有するものだけを置く。

## 11. 初期データ

IDを固定し、データを初期化するたびに同じ状態を作る。

### 11.1 商品

| 商品                 | カテゴリ   |     価格 | 在庫 | 公開状態 | 画像ファイル               |
| -------------------- | ---------- | -------: | ---: | -------- | -------------------------- |
| ミニノート           | stationery |    199円 |  100 | 公開     | `mini-notebook.webp`       |
| ケーブルホルダー     | accessory  |    680円 |   30 | 公開     | `cable-holder.webp`        |
| デスクマット         | desk       |  2,980円 |   20 | 公開     | `desk-mat.webp`            |
| メカニカルキーボード | desk       | 12,800円 |   10 | 公開     | `mechanical-keyboard.webp` |
| モニタースタンド     | desk       |  4,800円 |    0 | 公開     | `monitor-stand.webp`       |

各画像の原本はアプリルートの`samples/products/`へ保存する。シード処理は同名のファイルをSeaweedFSの`tiny-commerce`バケットへ`products/<ファイル名>`としてアップロードする。商品の`imageKey`には同じオブジェクトキーを設定する。

### 11.2 クーポン

| コード     | 割引額 | 最低購入金額 | 状態 |
| ---------- | -----: | -----------: | ---- |
| WELCOME500 |  500円 |      3,000円 | 有効 |
| SMALL100   |  100円 |          0円 | 有効 |
| OLD500     |  500円 |          0円 | 無効 |

## 12. テストと再現性

- 金額計算はDBを使用しない単体テストで確認する
- サービスはテスト用SQLiteを使用して確認する
- カートの金額計算と注文確定が同じ金額を返すことを確認する
- 固定額クーポン、無効クーポン、最低購入金額未満を確認する
- 在庫不足、非公開商品、数量の境界値を確認する
- 注文保存と在庫減算が同時に成功または失敗することを確認する
- シードデータのIDを固定する
- シード処理を決定論的にする
- シードを複数回実行してもDBレコードと画像が重複しないことを確認する
- 初期画像がSeaweedFSの公開URLからブラウザへ直接配信されることを確認する
- インターネット上の外部APIへ依存しない
- データを初期状態へ戻すコマンドを用意する
