import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const USERNAME = "joshuaproxman127";
const PASSWORD = "89340newrelation";
const SECURITY_ANSWER = "idek";
const BLOCKED_KEY = "owner.blockedIps";
const RECENT_KEY = "owner.recentInteractions";

type Interaction = { ip: string; path: string; at: number };

export const Route = createFileRoute("/api/public/owner")({
  component: OwnerPage,
  head: () => ({
    meta: [{ title: "Owner Panel" }],
  }),
});

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function OwnerPage() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const [blocked, setBlocked] = useState<string[]>([]);
  const [recent, setRecent] = useState<Interaction[]>([]);

  useEffect(() => {
    setBlocked(loadJSON<string[]>(BLOCKED_KEY, []));
    setRecent(loadJSON<Interaction[]>(RECENT_KEY, []));
  }, [authed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === USERNAME && pass === PASSWORD && answer.trim().toLowerCase() === SECURITY_ANSWER) {
      setAuthed(true);
      setError("");
    } else {
      setError("Invalid credentials.");
    }
  };

  const block = (ip: string) => {
    const next = Array.from(new Set([...blocked, ip]));
    setBlocked(next);
    saveJSON(BLOCKED_KEY, next);
  };

  const unblock = (ip: string) => {
    const next = blocked.filter((b) => b !== ip);
    setBlocked(next);
    saveJSON(BLOCKED_KEY, next);
  };

  if (!authed) {
    return (
      <div style={styles.shell}>
        <form onSubmit={submit} style={styles.card}>
          <h1 style={styles.h1}>Owner Login</h1>

          <label style={styles.label}>User</label>
          <input
            style={styles.input}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />

          <label style={styles.label}>Security Question: How was your day?</label>
          <input
            style={styles.input}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button}>Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={{ ...styles.card, maxWidth: 720 }}>
        <h1 style={styles.h1}>Owner Panel</h1>

        <section style={styles.section}>
          <h2 style={styles.h2}>Hardware IPs / Recent Interactions</h2>
          {recent.length === 0 ? (
            <p style={styles.muted}>No interactions logged yet. (Wire this up to your backend later.)</p>
          ) : (
            <ul style={styles.list}>
              {recent.map((r, i) => (
                <li key={i} style={styles.row}>
                  <span><strong>{r.ip}</strong> — {r.path}</span>
                  {blocked.includes(r.ip) ? (
                    <span style={styles.blockedTag}>BLOCKED</span>
                  ) : (
                    <button style={styles.dangerBtn} onClick={() => block(r.ip)}>Block</button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              id="manualIp"
              placeholder="Manually block an IP"
              style={{ ...styles.input, marginBottom: 0 }}
            />
            <button
              style={styles.dangerBtn}
              onClick={() => {
                const el = document.getElementById("manualIp") as HTMLInputElement | null;
                if (el?.value.trim()) {
                  block(el.value.trim());
                  el.value = "";
                }
              }}
            >
              Block
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>BLOCKED</h2>
          {blocked.length === 0 ? (
            <p style={styles.muted}>No IPs are currently blocked.</p>
          ) : (
            <ul style={styles.list}>
              {blocked.map((ip) => (
                <li key={ip} style={styles.row}>
                  <span><strong>{ip}</strong></span>
                  <button style={styles.button} onClick={() => unblock(ip)}>Unblock</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button style={{ ...styles.button, background: "#444" }} onClick={() => setAuthed(false)}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#0f1115",
    color: "#e8e8e8",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#1a1d24",
    borderRadius: 10,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  h1: { fontSize: 24, marginBottom: 18 },
  h2: { fontSize: 18, marginBottom: 10 },
  label: { display: "block", fontSize: 13, marginBottom: 6, color: "#aab" },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 14,
    background: "#0f1115",
    border: "1px solid #2a2f3a",
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: "10px 14px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerBtn: {
    padding: "6px 12px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  error: { color: "#f87171", marginBottom: 12, fontSize: 13 },
  section: { marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #2a2f3a" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #23262e",
  },
  muted: { color: "#7a8290", fontSize: 13 },
  blockedTag: {
    color: "#f87171",
    fontWeight: 700,
    letterSpacing: 1,
  },
};
