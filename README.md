# Claude Code本 教材リポジトリ

TinyCommerceを使い、調査・実装・確認を学ぶ教材です。`templates`は開始原本、配布済みの`projects`は読者の作業先、`examples`は完成例です。

| 章 | 開始原本 | 作業先 |
| --- | --- | --- |
| 第3〜5章（継続） | templates/basic | projects/commerce |
| 第6章（独立） | templates/bugfix | projects/chapter06 |
| 第7章（独立） | templates/reviews | projects/chapter07 |
| 第8章（独立） | templates/workflows | projects/chapter08 |

第5章の点数表示・Undo、第7章の商品詳細・レビューは未実装です。第6章の送料バグ、第8章の未使用変数lintエラーは演習用です。

## 始め方

Bun 1.3以降とDocker Composeを用意し、配布済みの作業先へ移動します。第5章では第3・4章の作業をそのまま継続します。

```sh
cd projects/commerce
bun install --frozen-lockfile
bun run dev
```

第6〜8章では表の作業先を使います。前のアプリはCtrl+C後、停止処理完了まで待ってください。Webは5173（使用中なら失敗）、SeaweedFSは8333を使用します。複数アプリを同時起動しないでください。同じ`http://localhost:5173`ではlocalStorageのカートを持ち越すため、再読み込み後、商品・数量・クーポンを章の条件へ揃えます。

通常起動は既存の商品・在庫・公開状態・クーポン・注文を保持し、不足する初期データと画像だけを追加します。DBの初期化は明示的な`reset:db`で行う破壊的操作なので、必要なデータを先に退避してください。原本を既存作業先へ上書きしないでください。

## やり直す場合

既存作業先は残し、まだ存在しない別名の作業先へ原本をコピーします。次は第5章を別の場所で試す例です。

macOSのターミナル：

```sh
test ! -e projects/commerce-retry && cp -R templates/basic projects/commerce-retry
```

Windows PowerShell：

```powershell
if (Test-Path projects/commerce-retry) { throw 'コピー先が既に存在します' }
Copy-Item -Recurse templates/basic projects/commerce-retry
```

他章も表の原本と、新しいコピー先名を指定します。前章のDBを移す必要はありません。既存のデータが残る作業先を初期状態だと思って起動しないでください。

## 完成例と著者用検証

`examples/completed/chapter07`は旧`projects/commerce`のtrackedコードを完全保存したものです。レビュー以外の管理画面やCSSの差分も含みます。元のseedは既存データを更新するため、完成例は新しい隔離コピー・新しいDBでのみ試してください。完成例の通常起動は読者の開始原本と異なります。

検証結果と未完了項目は[著者用報告](docs/author/implementation-report.md)を参照してください。第8章Goalの基準画像生成と実ブラウザ比較はLinuxで実測済みです（開始11.351190476190476%、完成0%）。ECアプリの実起動、S3画像配信、第5〜7章の主要な実習操作も隔離環境で確認済みです。別OS、実Claude固有の連携動作、掲載スクショの撮り直しは残っています。
