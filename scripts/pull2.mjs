// Second pull: full paperwork per account + every file id from accounts.json.
// Run: node scripts/pull2.mjs  (one call per minute, enforced inside lib/mcp.js)
import { mkdir, writeFile, readFile } from "node:fs/promises";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const tokenMatch = envText.match(/^AQ_TOKEN\s*=\s*"?([^"\r\n]*)"?\s*$/m);
if (tokenMatch?.[1]) process.env.AQ_TOKEN ??= tokenMatch[1].trim();
if (!process.env.AQ_TOKEN) {
  console.error("No AQ_TOKEN found in .env.local");
  process.exit(1);
}

const { callTool } = await import("../lib/mcp.js");

async function save(name, obj) {
  await mkdir("data", { recursive: true });
  await writeFile(`data/${name}.json`, JSON.stringify(obj, null, 2));
  console.log(`saved data/${name}.json`);
}

const accounts = JSON.parse(await readFile("data/accounts.json", "utf8"));
const fileIds = (accounts.files ?? []).map((f) => f.id);
const accountIds = (accounts.accounts ?? []).map((a) => a.id);

const plan = [
  ...accountIds.map((id) => [`paperwork-${id}`, () => callTool("get_all_paperwork", { account: id })]),
  ...fileIds.map((id) => [`file-${id}`, () => callTool("get_file", { id })]),
];

for (const [name, run] of plan) {
  try {
    await save(name, await run());
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
  }
}

console.log("Second pull done.");
