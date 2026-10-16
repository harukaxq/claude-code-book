設定したHookによって、コードが自動整形されることを確認してください。

- 次のTypeScriptコードを、この書式のままWriteツールで`src/format-demo.ts`に書き込んでください。
- この確認では、HookやPrettierの設定を変更せず、整形コマンドやリントの自動修正も実行しないでください。Claude Code自身による書式の修正も行わないでください。
- 書き込み後はReadツールでファイルを読み、空白・改行・インデントが変化したかを報告してください。整形されていない場合も、修正せず結果だけを報告してください。

書き込むコード：

```typescript
export function calculateTotal(price:number,quantity:number){return price*quantity}
```
