// One-shot local pull: fetches each base tool once (respecting 1 call/min) and stores JSON in data/.
// Run: node scripts/pull.mjs
import { mkdir, writeFile, readFile } from "node:fs/promises";

// Node does not auto-load .env.local outside Next.js — load it manually.
const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const tokenMatch = envText.match(/^AQ_TOKEN\s*=\s*"?([^"\r\n]*)"?\s*$/m);
if (tokenMatch?.[1]) process.env.AQ_TOKEN ??= tokenMatch[1].trim();
if (!process.env.AQ_TOKEN) {
  console.error("No AQ_TOKEN found in .env.local — paste your token and retry.");
  process.exit(1);
}

const { callTool } = await import("../lib/mcp.js");

const OUT = "data";

async function save(name, obj) {
  await mkdir(OUT, { recursive: true });
  await writeFile(`${OUT}/${name}.json`, JSON.stringify(obj, null, 2));
  console.log(`saved data/${name}.json`);
}

const plan = [
  ["data-format", () => callTool("get_data_format")],
  ["whoami", () => callTool("whoami")],
  ["accounts", () => callTool("get_my_accounts")],
  ["signals", () => callTool("get_signals")],
  ["feature-requests", () => callTool("get_feature_requests")],
  ["release-notes", () => callTool("get_release_notes")],
  ["team", () => callTool("get_flytbase_team")],
];

for (const [name, run] of plan) {
  try {
    await save(name, await run());
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
  }
}

console.log("Base pull done. Next: paperwork + files once we know the account ids.");
