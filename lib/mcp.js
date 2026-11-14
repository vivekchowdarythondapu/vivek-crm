// Server-only MCP client. This file is imported by API routes and scripts — never by browser code.
// The token stays in an environment variable; nothing in the repo or the browser ever sees it.

const MCP_URL = "https://questathon.aihackerscollective.com/api/public/mcp";

// Rate limit: one call per minute per token (reads AND writes count).
let lastCallAt = 0;

// Small in-process memory cache so accidental duplicate reads cost nothing.
const memCache = new Map();

export async function callTool(name, args = {}) {
  const key = name + "::" + JSON.stringify(args ?? {});

  // Notes are writes — never cache them.
  if (name !== "write_note" && memCache.has(key)) return memCache.get(key);

  // Enforce the one-call-per-minute rule.
  const wait = Math.max(0, 61_000 - (Date.now() - lastCallAt));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${process.env.AQ_TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) throw new Error(`MCP HTTP ${res.status} ${await res.text()}`);
  const json = await res.json();
  const { result, error } = json;
  if (error || result?.isError) {
    throw new Error(error?.message ?? result?.content?.[0]?.text ?? "MCP call failed");
  }

  const parsed = JSON.parse(result.content[0].text);
  if (name !== "write_note") memCache.set(key, parsed);
  return parsed;
}
