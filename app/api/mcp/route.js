// One server-side door for every MCP read/write.
// The browser calls this route; this route calls the MCP with the token.
import { callTool } from "../../../lib/mcp";

// A cold cache miss may need to wait out the rate limit.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "whoami",
  "get_my_accounts",
  "get_file",
  "list_paperwork",
  "get_all_paperwork",
  "search_paperwork",
  "get_paperwork_record",
  "get_feature_requests",
  "get_release_notes",
  "get_flytbase_team",
  "get_signals",
  "get_data_format",
  "list_notes",
  "write_note",
]);

export async function POST(req) {
  try {
    const { name, args } = await req.json();
    if (!ALLOWED.has(name)) {
      return Response.json({ error: `Unknown tool: ${name}` }, { status: 400 });
    }
    const data = await callTool(name, args ?? {});
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
