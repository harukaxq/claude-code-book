> Linux・Chromium 145.0.7632.6で基準画像を生成し、開始状態11.351190476190476%、著者用完成fixture 0%を実測しました。別OSでの再現性とClaudeの/goal実行は未検証です。

# Goalの画像比較

作業先ルートで`bun install --frozen-lockfile`、`bun run goal:browser`を実行します。DockerもECサーバーも不要です。`goal/index.html`をブラウザで開いて内容を確認し、`bun run goal:compare`で測定してください。

変更対象は`goal/index.html`と`goal/style.css`だけです。参考画像`goal/reference.png`、フォント、依存バージョン、比較スクリプト、閾値は変更禁止です。参考画像の貼り付けで代用せずHTML/CSSで再現します。

Playwright 1.58.2の付属Chromium、headless、viewport 280×720、DPR 1、en-US、UTC、light、同梱Fira Monoを固定します。document.fonts.ready後にアニメーション無効でviewport全体を撮影します。外部通信やOSフォントには依存しません。pixelmatch 7.1.0でthreshold 0.1、includeAA trueとし、異なるピクセル数÷201,600×100を差分率とします。

`artifacts/goal/current.png`、`diff.png`、`result.json`へ出力します。差分率1%以下なら終了コード0、未達は1、実行環境の異常も非0です。エラーログを見て未達と環境エラーを区別してください。基準画像と撮影環境メタデータを同梱しています。上記Linux環境では開始状態が不合格、完成fixtureが合格となることを実測し、1%を採用しました。OSをまたぐ1%の再現性は未検証なので、別OSでは最初に著者用完成fixtureで校正し、成立しない場合は基準を勝手に緩めず記録してください。

同梱フォントのライセンスはFONT-LICENSE.txtです。
