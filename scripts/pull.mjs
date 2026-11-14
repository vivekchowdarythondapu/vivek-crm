// One-shot local pull: fetches each base tool once (respecting 1 call/min) and stores JSON in data/.
// Run: node scripts/pull.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { callTool } from "../lib/mcp.js";

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
