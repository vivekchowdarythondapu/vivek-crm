import { getAnswers } from "../lib/answers";
import Signals from "./components/Signals.jsx";

export const dynamic = "force-dynamic";

const STANCE_COLOR = {
  ally: "var(--good)",
  warm: "var(--accent)",
  neutral: "var(--muted)",
  guarded: "var(--bad)",
};

const SHORT = { a_renewal: "renewal", a_tarn: "Tarn", a_westmere: "Westmere", a_tender: "tender" };

// One-line, file-backed highlights for the evidence drawer. Each fact here was read off the stored file.
const FILE_HIGHLIGHTS = {
  A: [
    "flight_log Oct: Westmere 18 installed / 14 with live flights · Metro Central 9 / 3 · Tarn Valley 4 / 0 · Norwold 4 / 0 (training only) [file-flight_log_force_month]",
    "support_ticket_history: FB-10412 Tarn Valley data-flow docs for DPIA — Open, unassigned, last update 14/08/2026 · FB-10781 Metro Central flight-report export — Closed [file-support_ticket_history]",
    "draft_tender_spec: spec locks day 20 (§5.3) · briefing window opens day 8 · cost per flight + operating model = 40%, comparator = helicopter contract · §3.1/3.2 staffing still TBC [file-draft_tender_spec]",
    "helicopter_cost_overtime: all-in rate £1,500 per flying hour; monthly air-support hours 46–53 [file-helicopter_cost_overtime]",
    "clarification_template: written format — To / From / date / spec section / 3 questions / why each answer matters [file-clarification_template]",
  ],
  B: [
    "no files are filed under B in the export — B's own paper trail is empty, which is itself a finding",
    "the support-ticket file (filed under A's pack) mentions Aldermoor twice: FB-10903 Plant 11 dock offline — Pending customer since 30/09 · FB-10944 Plant 7 alert routing — Closed [file-support_ticket_history]",
  ],
};

function Cite({ id }) {
  if (!id) return null;
  return <span className="cite" title="source id">[{id}]</span>;
}

function Stance({ who, stance, cite }) {
  return (
    <div>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: 8,
          background: STANCE_COLOR[stance] ?? "var(--muted)",
          marginRight: 6,
        }}
      />
      {who} <span className="cite">({stance})</span> <Cite id={cite} />
    </div>
  );
}

function PowerMap({ power }) {
  if (!power) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
      {[
        ["DECIDES", power.decides],
        ["PAYS", power.pays],
        ["USES", power.uses],
        ["BLOCKS", power.blocks],
      ].map(([label, list]) => (
        <div key={label}>
          <div className="cite" style={{ letterSpacing: 1 }}>{label}</div>
          {(list ?? []).map((x, i) => (
            <div key={i}>{x.who} <Cite id={x.cite} /></div>
          ))}
        </div>
      ))}
      <div style={{ gridColumn: "1 / -1" }}>
        <div className="cite" style={{ letterSpacing: 1 }}>WHERE EACH STANDS WITH ME</div>
        {(power.stands ?? []).map((s, i) => (
          <Stance key={i} {...s} />
        ))}
      </div>
    </div>
  );
}

function Account({ acc, signals }) {
  const won = (acc.offers ?? []).filter((o) => o.status === "won");
  const open = (acc.offers ?? []).filter((o) => o.status === "open");
  const declined = (acc.offers ?? []).filter((o) => o.status === "declined");
  const backedTotal = won.reduce((s, o) => s + (o.value ?? 0), 0);
  const morningSum = (acc.opportunities ?? []).reduce((s, o) => s + (o.morningValue ?? 0), 0);
  const hasDeadlines = (acc.deadlines ?? []).length > 0;

  return (
    <div className="panel" style={{ borderColor: "#3a4a5a" }}>
      <div className="acc-head">
        <span className="acc-avatar">{acc.id}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, letterSpacing: 0.5 }}>
            ACCOUNT {acc.id} — {acc.name}
          </h2>
          <span className="cite">
            Official story: {acc.officialStory} <Cite id={`official_story:${acc.id}`} />
          </span>
        </div>
      </div>

      {/* Q1 — WHAT IS THE BOOK WORTH */}
      <h3 style={{ color: "var(--good)", fontSize: 12, letterSpacing: 1, marginTop: 14 }}>💰 1 · WHAT IS THE BOOK WORTH?</h3>
      <p className="cite">
        Closed &amp; backed: <b style={{ color: "var(--text)" }}>${backedTotal.toLocaleString()}</b> — each deal backed by
        its own record below. Pipeline is listed deal-by-deal; no single champion total is claimed beyond the game's own
        morning evaluation, shown per deal where it exists.
      </p>
      {morningSum > 0 && (
        <p className="cite" style={{ margin: "4px 0 0" }}>
          Morning-review book, deal by deal:{" "}
          <b style={{ color: "var(--text)" }}>${(backedTotal + morningSum).toLocaleString()}</b> = $
          {backedTotal.toLocaleString()} closed
          {(acc.opportunities ?? [])
            .filter((o) => o.morningValue != null)
            .map((o) => (
              <span key={o.id}>
                {" + "}${o.morningValue.toLocaleString()} {SHORT[o.id] ?? o.id}
              </span>
            ))}{" "}
          <Cite id="morning-review" />
        </p>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {won.map((o) => (
            <tr key={o.id}>
              <td style={{ padding: "4px 8px 4px 0", color: "var(--good)" }}>WON ${o.value?.toLocaleString()}</td>
              <td>{o.title} → {o.pitchTo} <Cite id={o.id} /></td>
            </tr>
          ))}
          {(acc.opportunities ?? []).map((o) => {
            const dl = o.deadline;
            return (
              <tr key={o.id}>
                <td style={{ padding: "4px 8px 4px 0", whiteSpace: "nowrap" }}>
                  <span className={dl?.passed ? "tag bad" : dl?.soon ? "tag" : "tag good"}>
                    {dl?.passed ? "WINDOW PASSED" : dl?.soon ? "DEADLINE SOON" : "OPEN"}
                  </span>{" "}
                  up to ${o.worth_up_to?.toLocaleString()}
                </td>
                <td>
                  {o.title} · stage {o.stage} · blocker: {o.blocker?.text} <Cite id={o.id} />
                  {o.morningValue != null && (
                    <span className="cite"> · morning eval ${o.morningValue.toLocaleString()}</span>
                  )}
                  {dl && <span className="cite"> · deadline: {dl.text}</span>}
                </td>
              </tr>
            );
          })}
          {open.map((o) => (
            <tr key={o.id}>
              <td style={{ padding: "4px 8px 4px 0" }}>
                <span className="tag">OFFER OPEN</span> ${o.value?.toLocaleString()}
              </td>
              <td>
                {o.title} → {o.pitchTo} — not pitched yet; a guarded contact gets a built case first, not an offer{" "}
                <Cite id={o.id} />
              </td>
            </tr>
          ))}
          {declined.map((o) => (
            <tr key={o.id}>
              <td style={{ padding: "4px 8px 4px 0", color: "var(--bad)" }}>DECLINED ${o.value?.toLocaleString()}</td>
              <td>
                {o.title} → {o.pitchTo} — declined too early: offered before the underlying case was built{" "}
                <Cite id={o.id} />
              </td>
            </tr>
          ))}
          {(acc.unknownDeals ?? []).map((d, i) => (
            <tr key={`ud-${i}`}>
              <td style={{ padding: "4px 8px 4px 0" }}>
                <span className="tag bad">NEVER HEARD OF</span>
              </td>
              <td>
                {d.title} — {d.detail} · likely owner: {d.owner} <Cite id="morning-review" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Q2 — WHO HOLDS THE POWER */}
      <h3 style={{ color: "var(--good)", fontSize: 12, letterSpacing: 1, marginTop: 14 }}>🧭 2 · WHO HOLDS THE POWER?</h3>
      <div className="grid">
        {[...(acc.opportunities ?? []), ...(acc.offers ?? [])]
          .filter((o) => o.power)
          .map((o) => (
            <div key={o.id} className="panel" style={{ margin: 0 }}>
              <b style={{ fontSize: 12 }}>{o.title}</b>
              <PowerMap power={o.power} />
            </div>
          ))}
      </div>
      <p className="cite" style={{ marginTop: 6 }}>
        People on the account:{" "}
        {(acc.stakeholders ?? []).map((s, i) => (
          <span key={s.id}>
            {i > 0 && " · "}
            {s.name} ({s.relationship}) <Cite id={s.id} />
          </span>
        ))}
      </p>
      {(acc.unmet ?? []).length > 0 && (
        <p className="cite" style={{ marginTop: 4 }}>
          Never met (morning review):{" "}
          {acc.unmet.map((u, i) => (
            <span key={u.name}>
              {i > 0 && " · "}
              <b style={{ color: "var(--text)" }}>{u.name}</b> — {u.role}; {u.why} <Cite id="morning-review" />
            </span>
          ))}
        </p>
      )}

      {/* Q3 — WHAT DO YOU DO FIRST */}
      <h3 style={{ color: "var(--good)", fontSize: 12, letterSpacing: 1, marginTop: 14 }}>⚡ 3 · WHAT DO I DO FIRST?</h3>
      <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
        {(acc.moves ?? []).map((m) => (
          <li key={m.rank} style={{ marginBottom: 8 }}>
            <b>{m.action}</b>
            <div className="cite">
              owner: {m.owner} · by {m.by} · moves: {m.moves} · cites: {m.cites?.join(", ")}
            </div>
          </li>
        ))}
      </ol>
      {(acc.drafts ?? []).length > 0 && (
        <>
          <h3 style={{ color: "var(--accent)", fontSize: 12, letterSpacing: 1, marginTop: 12 }}>✍️ 3b · DRAFTS WRITTEN AND READY TO SEND</h3>
          {acc.drafts.map((d, i) => (
            <div key={i} style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 10, margin: "8px 0" }}>
              <b>To: {d.to}</b>
              <div className="cite">
                owner: {d.owner} · by {d.by} · cites: {d.cites?.join(", ")}
              </div>
              <pre style={{ whiteSpace: "pre-wrap", margin: "4px 0 0", fontSize: 12, color: "var(--text)", fontFamily: "inherit" }}>{d.text}</pre>
            </div>
          ))}
        </>
      )}

      {/* Q4 — WHAT IS ABOUT TO GO WRONG */}
      <h3 style={{ color: "var(--bad)", fontSize: 12, letterSpacing: 1, marginTop: 14 }}>🚨 4 · WHAT IS ABOUT TO GO WRONG?</h3>
      {(acc.risks ?? []).map((r, i) => (
        <div key={i} style={{ borderLeft: "3px solid var(--bad)", paddingLeft: 10, margin: "8px 0" }}>
          <b>{r.title}</b> <Cite id={r.cites?.join(", ")} />
          <div className="cite">{r.detail}</div>
          <div className="cite" style={{ color: "var(--bad)" }}>turns bad: {r.turnsBadWhen}</div>
        </div>
      ))}

      {/* Q5 — WHAT DO I STILL NOT KNOW */}
      <h3 style={{ color: "var(--good)", fontSize: 12, letterSpacing: 1, marginTop: 14 }}>🔍 5 · WHAT DO I STILL NOT KNOW?</h3>
      {(acc.gaps ?? []).map((g, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <b>{g.question}</b> <Cite id={g.cites?.join(", ")} />
          <div className="cite">why it matters: {g.why}</div>
          <div className="cite">who could fill it: {g.who}</div>
        </div>
      ))}

      {/* Evidence drawer */}
      <details style={{ marginTop: 10 }}>
        <summary className="cite" style={{ cursor: "pointer" }}>
          Evidence — every fact, file, offer and deadline behind this account (click to open)
        </summary>
        <div className="grid" style={{ marginTop: 8 }}>
          <div>
            <div className="cite" style={{ letterSpacing: 1 }}>FACTS</div>
            {(acc.facts ?? []).map((f) => (
              <div key={f.id} style={{ marginBottom: 4 }}>
                <span className="tag">{f.status}</span> {f.text} <Cite id={f.id} />
                <div className="cite">— {f.said_by}</div>
              </div>
            ))}
            {(acc.facts ?? []).length === 0 && <p className="cite">no facts recorded — account B has none in the export</p>}
          </div>
          <div>
            <div className="cite" style={{ letterSpacing: 1 }}>FILES</div>
            {(acc.files ?? []).map((f) => (
              <div key={f.id}>
                {f.title} <Cite id={f.id} /> <span className="cite">{f.path}</span>
              </div>
            ))}
            <div className="cite" style={{ letterSpacing: 1, marginTop: 8 }}>DEADLINES</div>
            {hasDeadlines ? (
              (acc.deadlines ?? []).map((d, i) => (
                <div key={i} className={d.passed ? "cite" : ""}>
                  {d.passed ? "✗ PASSED · " : "○ OPEN · "}
                  {d.text}
                </div>
              ))
            ) : (
              <p className="cite">none recorded</p>
            )}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="cite" style={{ letterSpacing: 1 }}>FILE CONTENTS — pulled once, stored in the repo, full text below</div>
            {(acc.fileTexts ?? []).length === 0 && <p className="cite">no files for this account in the export</p>}
            {(acc.fileTexts ?? []).map((f) => (
              <details key={f.id} style={{ margin: "4px 0" }}>
                <summary className="cite" style={{ cursor: "pointer" }}>
                  {f.title ?? f.name ?? f.id} <Cite id={f.id} />
                </summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "var(--text)", margin: "4px 0 0" }}>{f.text}</pre>
              </details>
            ))}
            {(FILE_HIGHLIGHTS[acc.id] ?? []).map((h, i) => (
              <div key={i} className="cite">• {h}</div>
            ))}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="cite" style={{ letterSpacing: 1 }}>
              PAPERWORK — every call note and email on record ({(acc.paperwork?.records ?? []).length})
            </div>
            {(acc.paperwork?.records ?? []).map((r) => (
              <details key={r.path} style={{ margin: "4px 0" }}>
                <summary className="cite" style={{ cursor: "pointer" }}>
                  {r.kind} · {r.path}
                </summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "var(--text)", margin: "4px 0 0" }}>{r.text}</pre>
              </details>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

export default async function Page() {
  const data = await getAnswers();
  if (!data) {
    return (
      <div className="wrap">
        <header className="top">
          <h1>QUESTATHON CRM</h1>
        </header>
        <div className="panel">No stored data found. Run <code>node scripts/pull.mjs</code> first.</div>
      </div>
    );
  }

  const wonTotal = data.accounts.reduce(
    (s, acc) => s + (acc.offers ?? []).filter((o) => o.status === "won").reduce((x, o) => x + (o.value ?? 0), 0),
    0
  );
  const morningTotal =
    wonTotal +
    data.accounts.reduce(
      (s, acc) => s + (acc.opportunities ?? []).reduce((x, o) => x + (o.morningValue ?? 0), 0),
      0
    );
  const openTotal = data.accounts.reduce(
    (s, acc) => s + (acc.offers ?? []).filter((o) => o.status === "open").reduce((x, o) => x + (o.value ?? 0), 0),
    0
  );

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <span className="logo">V</span>
          <div>
            <h1>QUESTATHON CRM</h1>
            <span className="stamp">TWO ACCOUNTS · EVERY NUMBER TRACED · SNAPSHOT {data.exportedAt} · MINUTE {data.minute}</span>
          </div>
        </div>
        <div className="topbadges">
          <span className="badge grad">VIVEK · CSM-0257</span>
          <span className="badge live"><span className="pulse" />LIVE · POLLING 70s</span>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <div className="k">Closed &amp; backed</div>
          <div className="v g">${wonTotal.toLocaleString()}</div>
          <div className="s">priority support + training [a_priority_support, a_training]</div>
        </div>
        <div className="stat">
          <div className="k">Morning-review book</div>
          <div className="v g">${morningTotal.toLocaleString()}</div>
          <div className="s">deal by deal [morning-review]</div>
        </div>
        <div className="stat">
          <div className="k">Open offers</div>
          <div className="v">${openTotal.toLocaleString()}</div>
          <div className="s">B: $50k + $160k [b_priority_support, b_more_plants]</div>
        </div>
        <div className="stat">
          <div className="k">Answers live</div>
          <div className="v">5 × 2</div>
          <div className="s">worth · power · moves · risks · gaps</div>
        </div>
      </div>

      {data.accounts.map((acc) => (
        <Account key={acc.id} acc={acc} />
      ))}

      <Signals initialSignals={data.signals ?? []} />

      <footer className="cite" style={{ marginTop: 20 }}>
        Built for a manager with ten minutes. No number without a source id; no invented ids, facts or people; unbacked
        claims shown apart. The dashboard reads the stored snapshot and keeps itself live through get_signals, writing
        what it notices back with write_note.
      </footer>
    </div>
  );
}
