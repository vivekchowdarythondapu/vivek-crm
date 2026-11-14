# Vivek CRM

**Vivek chowdary · Questathon ID CSM-0257**

A live CRM for the two Questathon accounts. It reads account data through the
Questathon MCP, answers five questions for each account, and traces every
number back to the record it came from.

## What it answers (per account)

1. **What is the book worth?** — each deal at a backed value, with the file or
   person behind it. Anything the data does not support is shown apart, not
   folded into a total.
2. **Who holds the power?** — per deal: who decides, who pays, who uses it,
   who could block it, and where each stands.
3. **What do you do first?** — the first three moves, ranked, each with an
   owner, a date and the deal it moves, inside every deadline.
4. **What is about to go wrong?** — deadlines at risk, people going cold,
   deals stuck, and when each turns bad.
5. **What do you still not know?** — the gaps the plan rests on, why each
   matters, and who could fill it.

## How to run it

```bash
cp .env.example .env.local   # then paste your token into AQ_TOKEN
npm install
npm run dev                  # http://localhost:3000
```

Deployed copy: https://questathon-crm-puce.vercel.app
Source: https://github.com/vivekchowdarythondapu/vivek-crm

## Architecture

```
browser ──> /api/mcp (Next.js server route)
                 │  Bearer AQ_TOKEN (env var, server-only)
                 ▼
        questathon MCP (JSON-RPC, one call / minute / token)
```

- **Token safety** — `AQ_TOKEN` lives in `.env.local` / Vercel env vars. The
  browser never sees it; `lib/mcp.js` is imported only by server code.
- **Rate limit** — one call per minute per token, reads and writes included.
  `callTool` enforces a 61s gap and memoises duplicate reads.
- **Store** — the dashboard fetches each thing once, keeps it in
  `localStorage`, and afterwards spends calls only on `get_signals` (and
  `write_note` to record what it sees). Whatever arrives during the build
  appears without a reload.
- **Snapshot** — `data/*.json` is a full offline pull (`npm run pull`) used
  while designing the views.

## Rules honored

- Every number on the dashboard cites the record id it came from; nothing
  rests on a claim alone; no invented ids.
- Notes written back go through `write_note` only — the dashboard cannot
  change the game.
