# Claude Code本 教材リポジトリ

このリポジトリは、Claude Code本で使用する教材です。小さなECアプリ「TinyCommerce」を題材に、既存コードの調査、機能追加、バグ修正などを進めます。

`templates/`には章ごとの開始状態となる原本があり、`projects/`へコピーしたアプリを読者の作業場所として使います。

## 章とテンプレート

| 章 | 使用するテンプレート |
| --- | --- |
| 第3〜5章 | [`templates/basic`](templates/basic) |
| 第6章 | [`templates/bugfix`](templates/bugfix) |
| 第7章 | [`templates/reviews`](templates/reviews) |

第6章のテンプレートには、教材として調査・修正する不具合が含まれます。第7章のテンプレートは、第6章までの修正を反映した開始状態です。

## 必要な環境

- [Bun](https://bun.sh/) 1.3以降
- DockerとDocker Compose

## 始め方

### 第3〜5章

リポジトリ直下で、使用するテンプレートを`projects/`へコピーします。

```bash
cp -r templates/basic projects/commerce
cd projects/commerce
bun install
bun run dev
```

アプリは <http://localhost:5173> で開けます。終了するときは、起動したターミナルで`Ctrl+C`を押してください。

### 第6章

作業フォルダは[`projects/chapter06`](projects/chapter06)です。別のTinyCommerceが起動している場合は、先に停止してください。

作業フォルダがない場合は、リポジトリ直下で次のコマンドを実行し、原本からコピーします。すでにある場合は、コピーする必要はありません。

```bash
cp -r templates/bugfix projects/chapter06
```

VS Codeで`projects/chapter06`を開き、[`TICKET.md`](projects/chapter06/TICKET.md)の報告内容を確認してください。VS Codeのターミナルで次のコマンドを実行すると、第6章のアプリが起動します。

```bash
bun install
bun run dev
```

第6章の原本は[`templates/bugfix`](templates/bugfix)です。前章のコードやDBを移す必要はありません。

## やり直したいとき

`projects/`配下の作業ディレクトリを削除し、テンプレートからもう一度コピーするだけで開始状態へ戻せます。

## 注意事項

- `templates/`は教材の原本です。直接編集せず、必ず`projects/`へコピーして作業してください。
- SeaweedFSがポート8333を使用するため、複数のプロジェクトは同時に起動できません。起動中のプロジェクトを`Ctrl+C`で停止してから、次のプロジェクトを起動してください。
