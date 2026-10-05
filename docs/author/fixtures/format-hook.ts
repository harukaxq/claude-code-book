// 著者用完成例。読者の開始状態へコピーしない。
// プロジェクトのscripts/format-hook.tsへ置いて使用する。
import { realpath } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(
  resolve(dirname(fileURLToPath(import.meta.url)), ".."),
);
const input = JSON.parse(await Bun.stdin.text());
if (
  input.hook_event_name !== "PostToolUse" ||
  !["Edit", "Write"].includes(input.tool_name)
)
  process.exit(0);
if (typeof input.tool_input?.file_path !== "string") process.exit(0);
const target = await realpath(resolve(root, input.tool_input.file_path));
const local = relative(root, target);
if (
  !local ||
  isAbsolute(local) ||
  local === ".." ||
  local.startsWith(".." + sep)
)
  process.exit(0);
if (
  local
    .split(sep)
    .some((part) => ["node_modules", ".git", ".claude", "data"].includes(part))
)
  process.exit(0);
// argvを直接渡し、シェル文字列へファイル名を埋め込まない。
const child = Bun.spawn(
  [
    process.execPath,
    resolve(root, "node_modules/prettier/bin/prettier.cjs"),
    "--write",
    "--ignore-unknown",
    target,
  ],
  { cwd: root, stdout: "inherit", stderr: "inherit" },
);
process.exit(await child.exited);
