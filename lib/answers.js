// Server-only: computes the five answers for both accounts from the stored snapshot (data/*.json).
// Rule: every number and claim rendered on the dashboard must carry the id it came from.
// Analysis (who decides / pays / blocks, move ranking) is ours — each stance still cites a data id.
import { readFile } from "node:fs/promises";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

async function readJson(name) {
  try {
    return JSON.parse(await readFile(path.join(DATA, name), "utf8"));
  } catch {
    return null;
  }
}

// Parse the simple CSV files we pulled so rows can be cited as file:line.
function parseCsv(text) {
  if (typeof text !== "string") return null;
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return null;
  const header = lines[0].split(",").map((s) => s.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((s) => s.trim());
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    row.__line = null; // line numbers are assigned by the caller
    return row;
  });
  return { header, rows, lineCount: lines.length };
}

export async function getAnswers() {
  const [accountsExport, signals, notes] = await Promise.all([
    readJson("accounts.json"),
    readJson("signals.json"),
    readListNotes(),
  ]);
  if (!accountsExport) return null;

  const fileTexts = {};
  for (const f of accountsExport.files ?? []) {
    const pulled = await readJson(`file-${f.id}.json`);
    fileTexts[f.id] = pulled; // { id, title, content? } — shape confirmed after pull2
  }
  const paperwork = {};
  for (const acc of accountsExport.accounts ?? []) {
    paperwork[acc.id] = await readJson(`paperwork-${acc.id}.json`);
  }

  // Morning-evaluated values from the game's THIS MORNING review (shown per deal after the morning).
  // Source: the game's own review panel, attached to each opportunity id — not invented.
  const MORNING = {
    A: { a_renewal: 132816, a_tarn: 65193, a_westmere: 0, a_tender: 551500 },
  };

  // ---- Power maps + moves are analysis; every stance cites a stakeholder id or fact id. ----
  const analysis = {
    A: {
      power: {
        a_renewal: {
          decides: [{ who: "Each force's chief finance officer (call-off approvals)", cite: "rc_funding_2" }],
          pays: [{ who: "Each force from its own budget — no pooled budget", cite: "rc_funding_2" }],
          uses: [{ who: "Westmere and Metro Central fly operationally", cite: "rc_appetite_2" }],
          blocks: [{ who: "Nobody has shown which forces actually use the docks", cite: "a_renewal" }],
          stands: [
            { who: "Insp. Karen Mbeki (user, Westmere)", stance: "warm", cite: "karen_mbeki" },
            { who: "Ewan Brooks (payer, Metro Central)", stance: "warm", cite: "ewan_brooks" },
            { who: "Hannah Doyle (procurement)", stance: "warm", cite: "hannah_doyle" },
            { who: "Rhys Calder (programme lead)", stance: "ally", cite: "rhys_calder" },
          ],
        },
        a_tarn: {
          decides: [{ who: "Fatima Osei — the DPIA cannot be signed without her", cite: "fo_dpia_2" }],
          pays: [{ who: "Tarn Valley / Norwold force budgets", cite: "rc_appetite_2" }],
          uses: [{ who: "Tarn Valley has never flown a live mission; Norwold only trains", cite: "rc_appetite_2" }],
          blocks: [{ who: "Data-flow documents requested 4 months ago, never sent (ticket unassigned)", cite: "pj_ticket" }],
          stands: [
            { who: "Fatima Osei (decider, DPO)", stance: "neutral", cite: "fatima_osei" },
            { who: "Norwold chief constable", stance: "cautious after privacy row", cite: "km_others_2" },
          ],
        },
        a_westmere: {
          decides: [{ who: "Metro Central's chief finance officer", cite: "eb_sign_2" }],
          pays: [{ who: "Metro Central finance (autumn bid window)", cite: "eb_window_2" }],
          uses: [{ who: "Metro Central operations fly operationally", cite: "rc_appetite_2" }],
          blocks: [{ who: "No cost per flight set against helicopter hours", cite: "eb_sign_2" }],
          stands: [{ who: "Ewan Brooks (finance business partner)", stance: "warm", cite: "ewan_brooks" }],
        },
        a_tender: {
          decides: [{ who: "Hannah Doyle's specification team (evaluation: cost per flight + operating model = 40%)", cite: "hd_weights_1" }],
          pays: [{ who: "Each force's CFO approves its own call-off", cite: "hd_calloff_2" }],
          uses: [{ who: "All four forces' drone units", cite: "rc_tender_0" }],
          blocks: [
            { who: "Specification has no costed operating model — locks soon", cite: "rc_tender_2" },
            { who: "Suppliers may only brief inside the formal clarification window", cite: "hd_window_2" },
          ],
          stands: [
            { who: "Hannah Doyle (decider)", stance: "warm", cite: "hannah_doyle" },
            { who: "Ewan Brooks (CFO gate for Metro Central call-off)", stance: "warm", cite: "eb_sign_2" },
          ],
        },
      },
      moves: [
        {
          rank: 1,
          action:
            "Answer Insp. Karen Mbeki IN WRITING, this week: (a) operator training dates before the 5 Dec public event, (b) the named person who answers if a dock fails on the day. She asked in writing + logged a ticket; nobody has replied.",
          owner: "Me (CSM)",
          by: "by 17 Nov",
          moves: "Renewal + event exposure on 5 Dec",
          cites: ["signal:account A 18 Nov", "a_training", "km_staff_2"],
        },
        {
          rank: 2,
          action:
            "Send Fatima Osei the data-flow pack (flows, retention periods, storage location, access controls). Engineering can produce it in a week with the CSM owning the ask; with it she finishes the DPIA in three weeks and Norwold copies her assessment.",
          owner: "Me (CSM), data from engineering",
          by: "by 21 Nov",
          moves: "Tarn Valley + Norwold go-live ($200k)",
          cites: ["srv_dataflow", "fo_needs_3", "fo_dpia_2", "pj_ticket"],
        },
        {
          rank: 3,
          action:
            "Submit the written clarification request in Hannah's format, inside the formal window, attaching a costed operating model: drone cost per flight set against the verified £1,500 helicopter all-in hour + the staffing plan (6 dual-duty officers, 9 more needed at 30 docks).",
          owner: "Me (CSM) + Ewan's payroll figure",
          by: "inside the briefing window, before the spec locks on day 20 (draft_tender_spec §5.3)",
          moves: "300-dock framework tender ($1.5M)",
          cites: ["hd_window_2", "clarification_template", "hd_weights_1", "eb_heli_1", "km_staff_2", "rc_tender_2"],
        },
      ],
      risks: [
        {
          title: "Tender specification locks — whatever is not in it is out",
          detail:
            "The spec has no costed operating model and nobody has agreed who would fly 300 docks. Cost per flight + operating model carry 40% of the evaluation.",
          turnsBadWhen: "Day 20 per the draft spec's own timetable (§5.3) — whatever is not in the spec by then is out",
          cites: ["a_tender", "rc_tender_2", "hd_weights_1", "draft_tender_spec"],
        },
        {
          title: "Rhys Calder leaves the drone programme in January — no successor named",
          detail:
            "Every call on file before handover was with him alone. He is the only ally; the alliance's relationship walks out with him.",
          turnsBadWhen: "January handover — relationship risk on every A deal",
          cites: ["signal:account A 17 Nov", "rhys_calder"],
        },
        {
          title: "Karen's written request (training dates + dock-failure owner) unanswered",
          detail: "Ahead of the 5 Dec public event. Logged as a ticket. Nobody has replied.",
          turnsBadWhen: "5 Dec event with no trained cover and no fallback owner",
          cites: ["signal:account A 18 Nov", "karen_mbeki"],
        },
        {
          title: "Metro Central's finance bid window has already passed",
          detail: "Ewan could only bid for more docks if the cost-per-flight blocker was cleared first. It wasn't.",
          turnsBadWhen: "Already passed — $250k waits for the next window (a year, per his own words)",
          cites: ["a_westmere", "eb_window_2"],
        },
      ],
      gaps: [
        {
          question: "What does a drone flight actually cost per flight (operators + overtime)?",
          why: "It is the blocker on Westmere ($250k), the CFO gate for any call-off, and 40% of the tender evaluation.",
          who: "Ewan Brooks — payroll could pull it in a week if he asks",
          cites: ["eb_drone_2", "eb_sign_2"],
        },
        {
          question: "When exactly does the tender specification lock?",
          why: "The draft spec's timetable says the briefing window opens day 8 and the spec locks on day 20 (§5.3). The exact in-game calendar date still needs confirming — via the written clarification window.",
          who: "Hannah Doyle (via the formal clarification window)",
          cites: ["draft_tender_spec", "hd_window_2", "rc_tender_2"],
        },
        {
          question: "Who replaces Rhys Calder on the alliance?",
          why: "Every relationship and call history sits with one person who leaves in January.",
          who: "Rhys Calder / the alliance programme board",
          cites: ["signal:account A 17 Nov"],
        },
        {
          question: "Who answers if a dock fails during the 5 Dec event?",
          why: "Karen asked in writing; nobody replied. An event failure without a named fallback is a public failure.",
          who: "Karen Mbeki + alliance operations",
          cites: ["signal:account A 18 Nov"],
        },
      ],
      drafts: [
        {
          to: "Insp. Karen Mbeki — written answer to her direct request",
          by: "by 17 Nov",
          owner: "Me (CSM)",
          text:
            "Karen — your written request, answered in writing: (1) Operator training dates before the 5 Dec event: [TODO: dates — to be confirmed with the training team; the $45k operator training was agreed this morning, see a_training]. (2) If a dock fails on the day: [TODO: named fallback owner + response time — nobody has been named yet; this is the gap]. I own both lists and will confirm them with you before the event.",
          cites: ["signal:account A 18 Nov", "a_training", "km_staff_2"],
        },
        {
          to: "Hannah Doyle — written clarification request, in her format",
          by: "inside the formal briefing window, before the spec locks",
          owner: "Me (CSM)",
          text:
            "Questions: (1) On what date does the specification lock? (2) The stated comparator is the current helicopter air support contract — about £1,500 all-in per hour [eb_heli_1]. Will the evaluation accept a drone cost per flight built against that comparator? (3) Cost per flight and operating model carry 40% [hd_weights_1] — may we attach a costed staffing model: six dual-duty officers today; scaling to 30 docks needs nine more trained operators and shift cover [km_staff_2]?",
          cites: ["hd_window_2", "clarification_template", "hd_weights_1", "eb_heli_1", "km_staff_2", "rc_tender_2"],
        },
      ],
    },
    B: {
      power: {
        b_priority_support: {
          decides: [{ who: "Beatriz Alonso, plant manager Plant 7", cite: "beatriz_alonso" }],
          pays: [{ who: "Plant 7 budget (via group)", cite: "beatriz_alonso" }],
          uses: [{ who: "Plant 7 night operations", cite: "b_priority_support" }],
          blocks: [{ who: "Beatriz is guarded — no built case has been put to her", cite: "beatriz_alonso" }],
          stands: [{ who: "Stefan Roy (group head of security)", stance: "neutral", cite: "stefan_roy" }],
        },
        b_more_plants: {
          decides: [{ who: "Stefan Roy, group head of security", cite: "stefan_roy" }],
          pays: [{ who: "Group / plant budgets", cite: "stefan_roy" }],
          uses: [{ who: "Plant 15 + two idle plants", cite: "b_more_plants" }],
          blocks: [{ who: "Three docks that fly most nights have flown nothing for two weeks — nobody has raised it", cite: "signal:account B 30 Nov" }],
          stands: [{ who: "Stefan Roy", stance: "neutral", cite: "stefan_roy" }],
        },
      },
      moves: [
        {
          rank: 1,
          action:
            "Pull the Aldermoor usage data for the three silent docks and raise it WITH Stefan Roy this week — docks that flew most nights stopped flying, stayed online, no ticket, nobody said anything. Lead with the data, ask what changed on site.",
          owner: "Me (CSM)",
          by: "this week",
          moves: "Plant 15 + 2 idle plants ($160k) + protects the sister-company case study",
          cites: ["signal:account B 30 Nov", "official_story:B"],
        },
        {
          rank: 2,
          action:
            "Meet the three people on B I have never met — Nadia Rahman (group finance controller), Owen Fitch (group IT infrastructure lead), Julian Tate (insurance and risk manager). Each one likely owns or gates one of the four deals I have never heard of (renewal, idle plants, insurance discount, case study).",
          owner: "Me (CSM)",
          by: "this week",
          moves: "The four unknown B deals",
          cites: ["morning-review:unmet"],
        },
        {
          rank: 3,
          action:
            "Fix the silent-dock story BEFORE the 40-plant sister-company case study publishes; only then build the night-ops case with Beatriz from her own numbers — never pitch the $50k offer to a guarded contact first.",
          owner: "Me (CSM) + Stefan Roy",
          by: "before the case study lands (date unknown — gap)",
          moves: "Account B narrative + night-time priority support ($50k)",
          cites: ["official_story:B", "signal:account B 30 Nov", "b_priority_support", "beatriz_alonso"],
        },
      ],
      risks: [
        {
          title: "Three docks silent for two weeks",
          detail:
            "New weekly usage for Aldermoor, 2–29 Nov: three docks that flew most nights flew nothing. All three stayed online. No ticket raised and nobody at the customer said anything.",
          turnsBadWhen: "When the sister company reads the case study — or when the docks get switched off",
          cites: ["signal:account B 30 Nov"],
        },
        {
          title: "Beatriz Alonso is guarded; the $50k offer sits open",
          detail: "Pitching an offer to a guarded contact without a built case burned Metro Central in the morning.",
          turnsBadWhen: "Any premature pitch hardens her stance",
          cites: ["beatriz_alonso", "b_priority_support"],
        },
        {
          title: "Four B deals are being run without me",
          detail:
            "The morning review lists: renew the Aldermoor contract (14 docks), bring the idle plants into regular patrol, protect and extend the insurance discount, and the 40-plant sister-company case study — all 'never heard of'. Unmet owners: Nadia Rahman (finance), Owen Fitch (IT), Julian Tate (insurance).",
          turnsBadWhen: "On each deal's own date — all four dates unknown today (gap)",
          cites: ["morning-review"],
        },
      ],
      gaps: [
        {
          question: "Why did the three busiest Aldermoor docks stop flying?",
          why: "It threatens the case study, the $160k expansion and possibly the installed base.",
          who: "Stefan Roy / Plant 7 ops — with the usage data in hand",
          cites: ["signal:account B 30 Nov"],
        },
        {
          question: "When does the 40-plant sister-company case study publish?",
          why: "It is B's whole expansion story; it must not cite numbers the usage data contradicts.",
          who: "Stefan Roy / FlytBase GTM (Yashash Rao)",
          cites: ["official_story:B"],
        },
        {
          question: "What does Beatriz Alonso's Plant 7 actually need at night?",
          why: "The $50k offer is open but she is guarded; her own spec has never been asked.",
          who: "Beatriz Alonso — ask, don't pitch",
          cites: ["beatriz_alonso"],
        },
        {
          question: "What are the four unknown B deals worth, and when does each one hit its date?",
          why: "The morning review lists four deals I have never heard of: renew the Aldermoor contract (14 docks), bring the idle plants into regular patrol, protect and extend the insurance discount, and the 40-plant sister-company case study. No worth and no date is on record for any of them.",
          who: "Stefan Roy (group security), Nadia Rahman (finance), Julian Tate (insurance) — meet all three this week",
          cites: ["morning-review"],
        },
      ],
      unknownDeals: [
        {
          title: "Renew the Aldermoor contract (14 docks)",
          detail: "Exists per the morning review; no record, no worth, no date on my side. The official story cites 14 docks installed, 13 flying.",
          owner: "Stefan Roy / Nadia Rahman",
          cites: ["morning-review", "official_story:B"],
        },
        {
          title: "Bring the idle plants into regular patrol",
          detail: "Plants with docks but no regular flying; the morning review treats it as a live deal I have never heard of.",
          owner: "Stefan Roy",
          cites: ["morning-review", "official_story:B"],
        },
        {
          title: "Protect and extend the insurance discount",
          detail: "An insurance discount tied to the flying programme; Julian Tate is the likely owner. Never discussed with me.",
          owner: "Julian Tate",
          cites: ["morning-review"],
        },
        {
          title: "40-plant sister-company case study",
          detail: "In preparation per the official story; the morning review lists it as a deal in motion. The silent docks make its numbers risky.",
          owner: "Stefan Roy / FlytBase GTM",
          cites: ["morning-review", "official_story:B", "signal:account B 30 Nov"],
        },
      ],
      unmet: [
        { name: "Nadia Rahman", role: "Group finance controller", why: "likely holds the renewal and idle-plants budget — never met", cites: ["morning-review"] },
        { name: "Owen Fitch", role: "Group IT infrastructure lead", why: "owns network and dock connectivity — never met", cites: ["morning-review"] },
        { name: "Julian Tate", role: "Insurance and risk manager", why: "owns the insurance discount — never met", cites: ["morning-review"] },
      ],
      drafts: [
        {
          to: "Stefan Roy — silent docks, leading with the usage data",
          by: "this week, before the case study moves",
          owner: "Me (CSM)",
          text:
            "Stefan — the weekly usage for Aldermoor, 2–29 Nov, shows three docks that flew most nights flew nothing; all three stayed online and no ticket was raised [signal:account B 30 Nov]. Before the 40-plant case study is published citing 13 of 14 docks flying [official_story:B], can we look at the three docks together? I will bring the dock-by-dock numbers; if anything changed on site — network, staffing, a decision to stop — I would rather we say it first. Suggested next step: 20 minutes this week, me + you, with the usage printout.",
          cites: ["signal:account B 30 Nov", "official_story:B"],
        },
      ],
    },
  };

  const out = { exportedAt: accountsExport.exported_at, minute: accountsExport.minute, accounts: [] };
  for (const acc of accountsExport.accounts ?? []) {
    const a = analysis[acc.id] ?? {};
    out.accounts.push({
      id: acc.id,
      name: acc.name,
      officialStory: acc.official_story,
      stakeholders: acc.stakeholders ?? [],
      unmet: a.unmet ?? [],
      facts: acc.facts ?? [],
      opportunities: (acc.opportunities ?? []).map((o) => ({
        ...o,
        power: a.power?.[o.id] ?? null,
        morningValue: MORNING[acc.id]?.[o.id] ?? null,
      })),
      unknownDeals: a.unknownDeals ?? [],
      offers: (acc.offers ?? []).map((o) => ({ ...o, power: a.power?.[o.id] ?? null })),
      paperwork: paperwork[acc.id],
      fileTexts: (accountsExport.files ?? [])
        .filter((f) => f.account === acc.id)
        .map((f) => ({ ...f, text: fileTexts[f.id]?.text ?? null })),
      deadlines: acc.deadlines ?? [],
      files: accountsExport.files?.filter((f) => f.account === acc.id) ?? [],
      moves: a.moves ?? [],
      risks: a.risks ?? [],
      gaps: a.gaps ?? [],
      drafts: a.drafts ?? [],
    });
  }
  out.signals = signals?.signals ?? [];
  out.notes = notes ?? [];
  out.fileTexts = fileTexts;
  out.paperwork = paperwork;
  return out;
}

async function readListNotes() {
  // list_notes is only available through the API at runtime; the page reads notes client-side.
  return null;
}

export { parseCsv };
