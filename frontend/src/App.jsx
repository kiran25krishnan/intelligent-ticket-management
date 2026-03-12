import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

const CATEGORY_META = {
  network:  { color: "#00d4ff", bg: "rgba(0,212,255,0.12)", icon: "◈" },
  hardware: { color: "#ff7c3a", bg: "rgba(255,124,58,0.12)",  icon: "◉" },
  software: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "◇" },
  access:   { color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: "◎" },
};

const STATUS_META = {
  open:        { color: "#facc15", label: "OPEN" },
  "in-progress": { color: "#60a5fa", label: "IN PROGRESS" },
  resolved:    { color: "#34d399", label: "RESOLVED" },
  closed:      { color: "#6b7280", label: "CLOSED" },
};

/* ─── tiny helpers ─── */
const api = async (path, opts = {}, token) => {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  return res.json();
};

/* ══════════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Both fields required"); return; }
    setLoading(true); setError("");
    try {
      const data = await api(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, { method: "POST" });
      if (data.access_token) onLogin(data.access_token);
      else setError(data.error || "Login failed");
    } catch { setError("Cannot reach server"); }
    setLoading(false);
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginNoise} />
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>
          <span style={styles.loginLogoIcon}>⬡</span>
          <span style={styles.loginLogoText}>TICKR</span>
        </div>
        <p style={styles.loginSub}>Intelligent Ticket Management</p>

        <div style={styles.field}>
          <label style={styles.label}>EMAIL</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="admin@company.com"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>PASSWORD</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
          />
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "AUTHENTICATING..." : "SIGN IN →"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CLASSIFY PANEL
══════════════════════════════════════════════ */
function ClassifyPanel({ token }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const classify = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await api("/classify-ticket", {
        method: "POST",
        body: JSON.stringify({ text }),
      }, token);
      if (data.category) setResult(data);
      else setError("Classification failed");
    } catch { setError("Server error"); }
    setLoading(false);
  };

  const cat = result ? CATEGORY_META[result.category] || CATEGORY_META.software : null;

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>
        <span style={styles.titleAccent}>◈</span> AI Classifier
      </h2>
      <p style={styles.panelDesc}>Describe an issue — the AI will categorize it instantly.</p>

      <textarea
        style={styles.textarea}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="e.g. VPN not connecting, outlook keeps crashing, need database access..."
        rows={4}
      />

      <button style={{ ...styles.btn, marginTop: 12 }} onClick={classify} disabled={loading}>
        {loading ? "CLASSIFYING..." : "CLASSIFY TICKET →"}
      </button>

      {error && <p style={styles.errorMsg}>{error}</p>}

      {result && (
        <div style={{ ...styles.resultCard, borderColor: cat.color, background: cat.bg }}>
          <div style={styles.resultHeader}>
            <span style={{ ...styles.catBadge, color: cat.color, borderColor: cat.color }}>
              {cat.icon} {result.category.toUpperCase()}
            </span>
            <span style={styles.resultCheck}>✓ CLASSIFIED</span>
          </div>
          <p style={styles.resultText}>"{result.ticket_text}"</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TICKET TABLE
══════════════════════════════════════════════ */
function TicketsPanel({ token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/tickets", {}, token);
      setTickets(data.tickets || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await api(`/admin/ticket/${id}?status=${status}`, { method: "PUT" }, token);
    await load();
    setUpdating(null);
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    setDeleting(id);
    await api(`/admin/ticket/${id}`, { method: "DELETE" }, token);
    await load();
    setDeleting(null);
  };

  const categories = ["all", ...Object.keys(CATEGORY_META)];
  const shown = filter === "all" ? tickets : tickets.filter(t => t.category === filter);

  /* stats */
  const stats = Object.keys(CATEGORY_META).map(cat => ({
    cat,
    count: tickets.filter(t => t.category === cat).length,
  }));

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeaderRow}>
        <h2 style={styles.panelTitle}>
          <span style={styles.titleAccent}>◉</span> All Tickets
        </h2>
        <button style={styles.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{tickets.length}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        {stats.map(s => (
          <div key={s.cat} style={{ ...styles.statCard, borderColor: CATEGORY_META[s.cat].color }}>
            <span style={{ ...styles.statNum, color: CATEGORY_META[s.cat].color }}>{s.count}</span>
            <span style={styles.statLabel}>{s.cat}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {categories.map(c => (
          <button
            key={c}
            style={{
              ...styles.filterBtn,
              ...(filter === c ? {
                background: c === "all" ? "#facc15" : CATEGORY_META[c]?.color,
                color: "#0a0a0a",
              } : {}),
            }}
            onClick={() => setFilter(c)}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loadingRow}>
          <span style={styles.spinner}>⟳</span> Loading tickets...
        </div>
      ) : shown.length === 0 ? (
        <div style={styles.emptyState}>No tickets found</div>
      ) : (
        <div style={styles.ticketList}>
          {shown.map(ticket => {
            const cat = CATEGORY_META[ticket.category] || CATEGORY_META.software;
            const statusMeta = STATUS_META[ticket.status] || STATUS_META.open;
            const isExpanded = expandedId === ticket._id;

            return (
              <div
                key={ticket._id}
                style={{
                  ...styles.ticketRow,
                  borderLeftColor: cat.color,
                  background: isExpanded ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <div style={styles.ticketMain} onClick={() => setExpandedId(isExpanded ? null : ticket._id)}>
                  <div style={styles.ticketLeft}>
                    <span style={{ ...styles.catDot, background: cat.color }} />
                    <div>
                      <p style={styles.ticketText}>{ticket.text || "—"}</p>
                      <p style={styles.ticketId}>ID: {ticket._id}</p>
                    </div>
                  </div>
                  <div style={styles.ticketRight}>
                    <span style={{ ...styles.catBadgeSm, color: cat.color, borderColor: cat.color }}>
                      {ticket.category?.toUpperCase() || "?"}
                    </span>
                    <span style={{ ...styles.statusBadge, color: statusMeta.color, borderColor: statusMeta.color }}>
                      {statusMeta.label}
                    </span>
                    <span style={styles.chevron}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.ticketExpanded}>
                    <div style={styles.statusRow}>
                      <span style={styles.label}>UPDATE STATUS:</span>
                      <div style={styles.statusBtns}>
                        {Object.entries(STATUS_META).map(([key, val]) => (
                          <button
                            key={key}
                            style={{
                              ...styles.statusBtn,
                              color: val.color,
                              borderColor: val.color,
                              opacity: ticket.status === key ? 1 : 0.45,
                              background: ticket.status === key ? `${val.color}22` : "transparent",
                            }}
                            onClick={() => updateStatus(ticket._id, key)}
                            disabled={updating === ticket._id}
                          >
                            {updating === ticket._id ? "..." : val.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => deleteTicket(ticket._id)}
                      disabled={deleting === ticket._id}
                    >
                      {deleting === ticket._id ? "DELETING..." : "⊗ DELETE TICKET"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("classify");

  if (!token) return <LoginPage onLogin={setToken} />;

  return (
    <div style={styles.appWrap}>
      <div style={styles.appNoise} />

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={styles.loginLogoIcon}>⬡</span>
          <span style={{ ...styles.loginLogoText, fontSize: 18 }}>TICKR</span>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "classify", icon: "◈", label: "Classify" },
            { id: "tickets",  icon: "◉", label: "Tickets" },
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.navBtn,
                ...(activeTab === tab.id ? styles.navBtnActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={() => setToken(null)}>
          ⊗ Logout
        </button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.topbarTitle}>
            Intelligent Ticket Management
          </h1>
          <span style={styles.topbarStatus}>● LIVE</span>
        </div>

        <div style={styles.content}>
          {activeTab === "classify" && <ClassifyPanel token={token} />}
          {activeTab === "tickets"  && <TicketsPanel  token={token} />}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const styles = {
  /* login */
  loginWrap: {
    minHeight: "100vh",
    background: "#080810",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    position: "relative",
    overflow: "hidden",
  },
  loginNoise: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(250,204,21,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  loginCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 2,
    padding: "48px 40px",
    width: 380,
    backdropFilter: "blur(20px)",
    position: "relative",
  },
  loginLogo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  loginLogoIcon: { fontSize: 28, color: "#facc15" },
  loginLogoText: { fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "#fff" },
  loginSub: { color: "#555", fontSize: 11, letterSpacing: 3, marginBottom: 36, marginTop: 4 },
  field: { marginBottom: 20 },
  label: { display: "block", fontSize: 10, letterSpacing: 3, color: "#666", marginBottom: 8 },
  input: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 1,
    color: "#fff",
    padding: "10px 14px",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    width: "100%",
    background: "#facc15",
    color: "#0a0a0a",
    border: "none",
    padding: "12px 20px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 1,
    transition: "transform 0.1s",
  },
  errorMsg: { color: "#f87171", fontSize: 12, marginBottom: 12, letterSpacing: 1 },

  /* app shell */
  appWrap: {
    display: "flex",
    minHeight: "100vh",
    background: "#080810",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#fff",
    position: "relative",
  },
  appNoise: {
    position: "fixed", inset: 0,
    background: "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(250,204,21,0.04) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  sidebar: {
    width: 200,
    borderRight: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    zIndex: 10,
    flexShrink: 0,
  },
  sidebarLogo: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "0 20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 24,
  },
  nav: { display: "flex", flexDirection: "column", gap: 4, padding: "0 12px", flex: 1 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    color: "#555",
    fontSize: 12,
    letterSpacing: 2,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 2,
    textAlign: "left",
    transition: "all 0.15s",
  },
  navBtnActive: { background: "rgba(250,204,21,0.1)", color: "#facc15" },
  navIcon: { fontSize: 14 },
  logoutBtn: {
    margin: "0 12px",
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#444",
    fontSize: 11,
    letterSpacing: 2,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 2,
  },

  /* main area */
  main: { flex: 1, display: "flex", flexDirection: "column", zIndex: 1 },
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 36px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.2)",
  },
  topbarTitle: { fontSize: 13, letterSpacing: 4, color: "#888", fontWeight: 400, margin: 0 },
  topbarStatus: { fontSize: 11, color: "#34d399", letterSpacing: 2 },
  content: { padding: "32px 36px", flex: 1 },

  /* panels */
  panel: { maxWidth: 900 },
  panelTitle: { fontSize: 16, letterSpacing: 3, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 },
  panelHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  titleAccent: { color: "#facc15" },
  panelDesc: { color: "#555", fontSize: 12, letterSpacing: 1, marginBottom: 24 },
  refreshBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
    color: "#666", fontSize: 11, letterSpacing: 2, padding: "6px 14px",
    cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", borderRadius: 2,
  },

  /* classify */
  textarea: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", padding: "14px", fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
    resize: "vertical", outline: "none", borderRadius: 2,
    lineHeight: 1.6,
  },
  resultCard: {
    marginTop: 20, border: "1px solid", borderRadius: 2, padding: "16px 20px",
    transition: "all 0.3s",
  },
  resultHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  catBadge: {
    border: "1px solid", padding: "4px 10px", fontSize: 11,
    letterSpacing: 3, borderRadius: 1, fontWeight: 700,
  },
  resultCheck: { color: "#34d399", fontSize: 11, letterSpacing: 2 },
  resultText: { color: "#aaa", fontSize: 13, fontStyle: "italic", margin: 0, lineHeight: 1.6 },

  /* tickets */
  statsRow: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  statCard: {
    flex: "1 0 80px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 2, padding: "14px 16px",
    background: "rgba(255,255,255,0.02)",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statNum: { fontSize: 24, fontWeight: 700, color: "#facc15" },
  statLabel: { fontSize: 10, letterSpacing: 2, color: "#555" },
  filterRow: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  filterBtn: {
    padding: "6px 14px", background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#555", fontSize: 10, letterSpacing: 2,
    cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", borderRadius: 1,
    transition: "all 0.15s",
  },
  loadingRow: { color: "#555", fontSize: 13, display: "flex", alignItems: "center", gap: 10, padding: 20 },
  spinner: { display: "inline-block", animation: "spin 1s linear infinite" },
  emptyState: { color: "#444", fontSize: 13, padding: 40, textAlign: "center", letterSpacing: 2 },
  ticketList: { display: "flex", flexDirection: "column", gap: 0 },
  ticketRow: {
    borderLeft: "3px solid",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s",
    cursor: "pointer",
  },
  ticketMain: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", gap: 12,
  },
  ticketLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  catDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  ticketText: { margin: 0, fontSize: 13, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ticketId: { margin: 0, fontSize: 10, color: "#444", letterSpacing: 1, marginTop: 3 },
  ticketRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  catBadgeSm: { fontSize: 9, letterSpacing: 2, border: "1px solid", padding: "2px 6px", borderRadius: 1 },
  statusBadge: { fontSize: 9, letterSpacing: 2, border: "1px solid", padding: "2px 6px", borderRadius: 1 },
  chevron: { color: "#444", fontSize: 10 },
  ticketExpanded: {
    padding: "0 16px 16px 36px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    paddingTop: 14,
  },
  statusRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" },
  statusBtns: { display: "flex", gap: 8, flexWrap: "wrap" },
  statusBtn: {
    padding: "5px 12px", background: "transparent",
    border: "1px solid", fontSize: 9, letterSpacing: 2,
    cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", borderRadius: 1,
    transition: "all 0.15s",
  },
  deleteBtn: {
    background: "transparent", border: "1px solid rgba(248,113,113,0.3)",
    color: "#f87171", fontSize: 10, letterSpacing: 2, padding: "6px 14px",
    cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", borderRadius: 1,
  },
};
