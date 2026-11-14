"use client";

import { useCallback, useEffect, useState } from "react";

// Client-side store: fetch each thing once, keep it in localStorage, read from there.
// After the first pull, refreshes only spend calls on get_signals (what changes).
const KEYS = ["whoami", "get_my_accounts", "get_signals", "get_feature_requests", "get_release_notes", "get_flytbase_team"];

function readCache(key) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`aq:${key}`);
  return raw ? JSON.parse(raw) : null;
}

function writeCache(key, value) {
  window.localStorage.setItem(`aq:${key}`, JSON.stringify(value));
}

export default function Page() {
  const [store, setStore] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    const next = {};
    for (const key of KEYS) next[key] = readCache(key);
    setStore(next);
  }, []);

  useEffect(refresh, [refresh]);

  async function call(name) {
    setBusy(name);
    setError("");
    try {
      const cached = readCache(name);
      if (cached) return; // already have it; reads cost a call each — spend them on signals
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      writeCache(name, json);
      refresh();
    } catch (e) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="wrap">
      <header className="top">
        <h1>QUESTATHON CRM — DATA CONSOLE</h1>
        <span className="stamp">build phase · token stays server-side</span>
      </header>

      <div className="panel">
        <h2>Pull (one call each, cached after)</h2>
        {KEYS.map((key) => (
          <button key={key} onClick={() => call(key)} disabled={busy !== null || !!store[key]}>
            {store[key] ? `✓ ${key}` : busy === key ? `calling ${key}…` : key}
          </button>
        ))}
        <button className="ghost" onClick={() => { Object.keys(window.localStorage).filter(k => k.startsWith("aq:")).forEach(k => window.localStorage.removeItem(k)); refresh(); }}>
          clear local cache
        </button>
        {error && <pre className="raw">⚠ {error}</pre>}
      </div>

      <div className="grid">
        {KEYS.map((key) =>
          store[key] ? (
            <div className="panel" key={key}>
              <h2>{key}</h2>
              <pre className="raw">{JSON.stringify(store[key], null, 2)}</pre>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
