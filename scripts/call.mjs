// Ad-hoc single tool call for debugging: node scripts/call.mjs <tool> '<json-args>'
// Example: node scripts/call.mjs get_all_paperwork '{"account":"A"}'
// Prints the parsed result. Saves to data/<tool>.json only with --save.
import { readFile, mkdir, writeFile } from "node:fs/promises";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const tokenMatch = envText.match(/^AQ_TOKEN\s*=\s*"?([^"\r\n]*)"?\s*$/m);
if (tokenMatch?.[1]) process.env.AQ_TOKEN ??= tokenMatch[1].trim();
if (!process.env.AQ_TOKEN) {
  console.error("No AQ_TOKEN in .env.local");
  process.exit(1);
}

const name = process.argv[2];
const rawArgs = process.argv[3] || "{}";
const doSave = process.argv.includes("--save");
if (!name) {
  console.error("usage: node scripts/call.mjs <tool> '<json>' [--save]");
  process.exit(1);
}

const { callTool } = await import("../lib/mcp.js");
try {
  const result = await callTool(name, JSON.parse(rawArgs));
  console.log(JSON.stringify(result, null, 2));
  if (doSave) {
    await mkdir("data", { recursive: true });
    await writeFile(`data/${name}.json`, JSON.stringify(result, null, 2));
    console.log(`saved data/${name}.json`);
  }
} catch (e) {
  console.error(`FAIL ${name}: ${e.message}`);
  process.exit(1);
}
