# HANDOFF — Questathon CRM build (Stage 2)

Date: 2026-11-14. Written by the previous AI co-pilot session so the next model can pick up seamlessly.

---

## 1. The competition context (do not lose this)

- Event: FlytBase **Questathon** at `questathon.aihackerscollective.com/play`. Player: **Vivek** (student).
- **Stage 1 (discovery morning) — COMPLETE, scored, do not touch.** Final morning numbers:
  **Insight 133 · Closed $105,000 · People 7 · Deals 4.** The user clicked FINISH DISCOVERY and the game moved to Stage 2 (the "Build" page).
- **Stage 2 = the judged deliverable.** Build a **live CRM** for the two accounts, hand in **FOUR links** by **03:47** (game clock; hand in EARLY — links stay editable until time is called). Solo — no working with other players. AI use is explicitly allowed ("Use any tools you like, AI included").
- Also on the game page: tab **"Hand in by 03:47"**, **Live events 3**, **Not handed in**. Toolkit tabs: CONNECT / YOUR DATA / THIS MORNING / IDEAS / HAND IN.

### The four hand-in links
1. **Live CRM link** — hosted, works without the laptop, opens in a private window, covers BOTH accounts.
2. **Public repository** — public, no sign-in, README says how to run it, **no token in the code**.
3. **Thinking doc** — one page Google Doc: what it does & for whom / how it decides (the rules) / what it does NOT do yet / how you used AI.
4. **Walkthrough video** — 3 minutes, Google Drive: five answers for one account, one number traced to its source, it picking up something new, the code briefly.

### The five questions the CRM must answer per account
1. **What is the book worth?** — each deal at a backed value with the file/person behind it; unbacked estimates shown APART, never summed into one big total.
2. **Who holds the power?** — per deal: who decides, who pays, who uses it, who could block it, where each stands with you.
3. **What do you do first?** — first THREE moves, ranked, each with an owner, a date, and the deal it moves, inside every deadline.
4. **What is about to go wrong?** — deadlines at risk, people going cold, deals stuck, when each turns bad.
5. **What do you still not know?** — the gaps the plan rests on, why each matters, WHO could fill each one.

### Judge rubric (Weak → Solid → Strong; target ALL Strong)
- Answers the five: all five, both accounts, actionable Monday.
- Numbers you can back: **every number cites its id; nothing rests on a claim; no invented ids.**
- The right first moves: ranked, owned, dated inside every deadline.
- Honest about gaps: what it does not know, why it matters, who to ask.
- Stays live: takes in new data by itself, writes notes back.
- "Your morning counts too. Judges may ask you to walk them through your CRM, live."

### Hard game rules
- MCP endpoint: `https://questathon.aihackerscollective.com/api/public/mcp` — POST JSON-RPC 2.0, header `authorization: Bearer aq1...`.
- **One call per minute per token** (reads AND writes). Strategy: fetch each thing ONCE, store it, then spend calls only on `get_signals` and `write_note`.
- Token lives on the server only — never in browser code, repo, or video.
- Do NOT show a number without its source. Do NOT invent an id, fact, or person.

### The 3 live events (must surface in the dashboard)
- **Account B, 30 Nov — Aldermoor:** three docks that fly most nights flew NOTHING for two weeks. All stayed online. No ticket raised. Nobody at the customer said anything. (Silent churn signal.)
- **Account A, 18 Nov — Eastern Counties:** Westmere needs an answer before a **public event on 5 Dec**. Inspr. Karen Mbeki wrote directly + logged a ticket: wants (1) dates for training more operators before the day, (2) who answers if a dock fails on the day. Nobody replied.
- **Account A, 17 Nov — Eastern Counties:** **Rhys Calder leaves the drone programme in January.** No successor named. Every call on file before handover was with him alone.

### MCP tools available (JSON-RPC `tools/call`)
`whoami`, `get_my_accounts`, `get_file {id}`, `list_paperwork {account?}`, `get_all_paperwork {account}`, `search_paperwork {q, account?}`, `get_paperwork_record {account, path}`, `get_feature_requests`, `get_release_notes`, `get_flytbase_team`, `get_signals`, `get_data_format`, `list_notes`, `write_note {text, account?, kind?, title?}`.

---

## 2. Stage 1 story (for the thinking doc + interview — already earned)

- Trust outcomes: **Rhys Calder = ALLY** ("On your side"; told him the Fatima 4-month delay straight), Karen Warm, Ewan peaked Warm then rebuilt to Warm at the end, Hannah Warm, Fatima Neutral→warming (best turnaround).
- Closed: **Priority support $60,000 + Operator training $45,000 = $105,000** (Karen Mbeki).
- Meta-rules discovered the hard way (each rule traces to a rejection — great thinking-doc material):
  1. **The approver's own journal notes "do not belong"** as evidence. Killed 4 deal sends. Build every pitch from the APPROVER'S OWN spec + "by when".
  2. **Winning evidence = data room files + third-party operational notes** (Karen's notes validated by Hannah/Ewan/Rhys), concrete numbers only.
  3. **Present-pain only** pitching; add-on offers require a built underlying case first.
  4. **Honesty beats spin**: admitting the 4-month delay turned Rhys into an ally; Fatima: "first time anyone has said that".
  5. Neel's test: "Would this convince someone who has never been on site?" = self-contained checkable numbers.
- Rejection template decoder: the *"And some of it does not belong."* slot + the specific missing piece (staffing / cost-per-flight / document coverage) is the exact signal of what evidence was absent.
- Banked intel worth citing in the CRM: Ewan confirmed helicopter **~£1,500 all-in per hour** (fixed rate + crew); drone overtime **lost in the payroll total** ("Payroll could pull it if I asked"); frameworks fear = *"Promises at the top, nobody paying at the bottom"*; helicopter does long pursuits/bad weather/big areas, drones do short local jobs; helicopter contract review in ~2 years; Karen: 2 officers ~40 min + dock vs one helicopter hour; 14 of 18 docks flew last month; 6 officers with other duties, overtime is the main cost; Fatima's spec: "Data flows, retention periods, where video is stored, and who can access it. With those, I can finish." Data quality: "Trust the second entry each month. The export doubles them."

---

## 3. Project state (exactly where things stopped)

**Project root: `D:\Projects\questathon-crm`** (sibling of the user's `D:\Projects\ai-portfolio` — separate folder, as the user demanded).

Stack: **Next.js 15.5.29 (App Router, plain JS, no TS/tailwind), React 19, npm**. Deploy target chosen by user: **Vercel**.

### Files built and their roles
| File | Role |
|---|---|
| `package.json` | next ^15, react ^19, `"type": "module"`; scripts: dev/build/start/pull |
| `.env.local` | **AQ_TOKEN already pasted by the user** (74 chars, starts `aq1`). GITIGNORED — never commit/print |
| `.env.example` | template with instructions |
| `lib/mcp.js` | server-only MCP client: Bearer token from env, JSON-RPC POST, 61s rate-limit guard, in-memory dedupe cache (never caches `write_note`) |
| `app/api/mcp/route.js` | the single server route the browser calls; allow-list of tool names; `maxDuration = 60` |
| `app/page.js` | temporary "data console" — client component, caches reads in `localStorage` under `aq:<tool>`, buttons per tool, renders raw JSON. Will be REPLACED by the real five-answers dashboard |
| `app/layout.js`, `app/globals.css` | dark mono theme; utility classes: `.panel`, `.grid`, `.tag`, `.cite`, `pre.raw` |
| `scripts/pull.mjs` | offline pull: loads `.env.local` MANUALLY (Node does not — this was the bug, now fixed in the file), pulls data-format, whoami, accounts, signals, feature-requests, release-notes, team into `data/*.json` |
| `README.md` | architecture diagram, run steps, rules honored (hand-in link 2 component) |
| `docs/thinking-doc-draft.md` | 1-page thinking doc draft (hand-in link 3) |
| `docs/video-script-draft.md` | 3-min video script (hand-in link 4) — written/committed by the USER, keep it |

### Verified working
- `npm install` ✅ (53 packages)
- `npm run build` ✅ compiles clean (`/` static, `/api/mcp` dynamic)
- git repo initialized, 1 commit on `main` (author "vivek chowdary", 13:08:30 +0530). Commit message: "Questathon CRM: MCP client, API route, data console, docs". Tree clean.
- Token validated: present in `.env.local`, length 74, prefix `aq1`.

### The last failure (now understood, fix already applied in `scripts/pull.mjs`)
First pull attempt: ALL 7 calls failed with `"Send your personal token: Authorization: Bearer aq1...."` — root cause: **Node does not auto-load `.env.local`** (that is a Next.js feature), so `process.env.AQ_TOKEN` was undefined. `scripts/pull.mjs` now reads `.env.local` and sets `process.env.AQ_TOKEN` before dynamically importing `lib/mcp.js`. **The pull has NOT been re-run yet.**

---

## 4. Next steps, in order (what the next model should do)

1. **Re-run the base pull** (background, ~7 min): `node scripts/pull.mjs` from the project root. Expect 7 files in `data/`. If a call fails with the token error again, debug `process.env.AQ_TOKEN` loading first — do not spam retries (1 call/min).
2. **Inspect the data shape**: read `data/accounts.json` + `data/data-format.json` FIRST. Find the two account identifiers (expected: A = Eastern Counties, B = Aldermoor) and the **file ids** referenced by deals/deadlines.
3. **Second pull** (~10+ min, same rate limit): `get_all_paperwork` for each account, then `get_file` for every file id discovered. Write a `scripts/pull2.mjs` following the same `.env.local`-loading pattern. Also save `list_paperwork` per account if useful.
4. **Build the real dashboard** (replace `app/page.js`): five answers per account with the rubric's Strong column as the spec:
   - every number renders with its source id (`.cite` class exists); unbacked estimates visually apart
   - power map per deal; first three moves ranked/owned/dated INSIDE every deadline; risk list with "when each turns bad"; honest gaps with who-to-ask
   - `get_signals` polling (client can poll every ~70s through `/api/mcp`) so new events appear without reload; `write_note` to record what it notices
   - use the 3 live events as the seed risks: Aldermoor silent docks, Karen's unanswered written request before Dec 5, Rhys leaving January with no successor (single point of failure)
5. **Deploy to Vercel**: `npx vercel` login (user's account), add `AQ_TOKEN` in project env vars, deploy, verify the URL opens in a **private window**.
6. **Push to GitHub** public repo (user has GitHub; repo is initialized, add remote, push `main`). README already covers run steps. Confirm NO token anywhere in repo history.
7. **Record the 3-min video** following `docs/video-script-draft.md` (traced number suggestion: the $60,000 priority support → its paperwork record id). Upload to Drive, shareable link.
8. **Finalize thinking doc** in Google Docs from `docs/thinking-doc-draft.md` — update "how you used AI" if it changed, keep it to ONE page.
9. **Hand in early** via the game's HAND IN tab: 4 links. Links stay editable until time is called.
10. **Rehearse the live walkthrough** — judges may ask the user to walk through the CRM live; the Stage 1 story (rejection-pattern → rule) is the narrative.

### Watch-outs for the next model
- NEVER print or commit the token. `.gitignore` already covers `.env*.local`.
- Rate limit is brutal: 61s minimum between calls, shared across everything. `lib/mcp.js` enforces it in-process; separate node processes each start their own clock — space manual calls accordingly.
- The user communicates best with short, scannable replies, emoji-friendly, informal English, and clear **👉 DO NOW / ⏭️ NEXT** ordering.
- User context: student, competing against a friend using generic GPT; technical + HR interview on Nov 16 depends on this round. Keep them motivated; losses in Stage 1 are framed as lessons (that framing is already in the thinking-doc draft).
- Windows machine; shell is PowerShell. Workdir for all commands: `D:\Projects\questathon-crm`.

---

## 5. One-paragraph TL;DR

Stage 1 of the Questathon is done (Insight 133 / $105k closed). Stage 2 asks for a live, hosted CRM answering five questions for two accounts with source-cited numbers, handed in as 4 links by 03:47. A Next.js app exists at `D:\Projects\questathon-crm` (builds clean, repo committed, token safely in `.env.local`); the only thing that ever failed was the data pull, because Node did not load `.env.local` — that fix is already in `scripts/pull.mjs`. Next: re-run the pull, inspect `data/accounts.json`, pull paperwork + files per account, build the five-answers dashboard with citations + signals + write_note, deploy to Vercel, push to GitHub, record the video, hand in early.
