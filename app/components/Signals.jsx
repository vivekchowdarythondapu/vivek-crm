"use client";

import { useCallback, useEffect, useRef, useState } from "react";

async function callMcp(name, args) {
  const res = await fetch("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

const keyOf = (s) => s?.id ?? JSON.stringify(s);

export default function Signals({ initialSignals }) {
  const [signals, setSignals] = useState(initialSignals ?? []);
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const known = useRef(new Set());

  const loadNotes = useCallback(async () => {
    try {
      const n = await callMcp("list_notes");
      setNotes(n?.notes ?? n ?? []);
    } catch (e) {
      setError(String(e.message ?? e));
    }
  }, []);

  const writeNote = useCallback(
    async (text, account, kind, title) => {
      try {
        await callMcp("write_note", { text, account, kind, title });
        setStatus(`note written: ${title ?? text.slice(0, 40)}`);
        await loadNotes();
      } catch (e) {
        setError(String(e.message ?? e));
      }
    },
    [loadNotes]
  );

  const refreshSignals = useCallback(async () => {
    try {
      const s = await callMcp("get_signals");
      const list = s?.signals ?? [];
      const fresh = list.filter((sig) => !known.current.has(keyOf(sig)));
      if (fresh.length > 0 && known.current.size > 0) {
        // The CRM noticed something new and writes it back — once per signal.
        for (const sig of fresh) {
          const text = `Noticed: ${sig?.title ?? sig?.text ?? JSON.stringify(sig).slice(0, 120)}`;
          await writeNote(text, sig?.account, "risk", `signal ${sig?.id ?? "new"}`);
          known.current.add(keyOf(sig));
        }
      }
      fresh.forEach((sig) => known.current.add(keyOf(sig)));
      setSignals(list);
      setStatus(`signals checked ${new Date().toLocaleTimeString()} — ${list.length} total`);
    } catch (e) {
      setError(String(e.message ?? e));
    }
  }, [writeNote]);

  useEffect(() => {
    (initialSignals ?? []).forEach((sig) => known.current.add(keyOf(sig)));
    loadNotes();
    refreshSignals();
    const t = setInterval(refreshSignals, 70_000); // 1 call/min limit → 70s
    return () => clearInterval(t);
  }, [initialSignals, loadNotes, refreshSignals]);

  return (
    <div className="panel">
      <h2>Live · signals &amp; notes written back</h2>
      <button onClick={refreshSignals} disabled={false}>check signals now</button>
      <span className="tag">{status || "polling every 70s"}</span>
      {error && <pre className="raw">⚠ {error}</pre>}

      <h3 style={{ color: "var(--muted)", fontSize: 12, margin: "10px 0 4px" }}>SIGNALS</h3>
      {signals.length === 0 && <p className="cite">none yet — this panel updates itself when the account moves</p>}
      {signals.map((sig, i) => (
        <div key={keyOf(sig) + i} style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 10, margin: "8px 0" }}>
          <span className="tag">{sig?.account ?? "?"}</span> <b>{sig?.title ?? "signal"}</b>
          <div className="cite">{sig?.text ?? sig?.detail ?? ""}</div>
          <button className="ghost" onClick={() => writeNote(`Next step: follow up "${sig?.title ?? "signal"}" — ${sig?.text ?? ""}`, sig?.account, "next_step", `signal ${sig?.id ?? i}`)}>
            write note
          </button>
        </div>
      ))}

      <h3 style={{ color: "var(--muted)", fontSize: 12, margin: "10px 0 4px" }}>NOTES THE CRM WROTE BACK (list_notes)</h3>
      {notes.length === 0 && <p className="cite">no notes yet</p>}
      {(notes ?? []).map((n, i) => (
        <div key={i} className="cite">
          [{n?.kind ?? "note"}] {n?.account ? `${n.account} · ` : ""}
          {n?.title ? `${n.title} — ` : ""}
          {n?.text ?? JSON.stringify(n)}
        </div>
      ))}
    </div>
  );
}
