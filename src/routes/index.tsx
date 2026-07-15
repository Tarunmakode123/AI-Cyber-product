import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: SentinelDashboard,
});

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Finding = {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  description: string;
};

const SEVERITY_STYLES: Record<Severity, { label: string; badge: string; dot: string }> = {
  critical: { label: "Critical", badge: "bg-critical/15 text-[oklch(0.75_0.20_25)] border-critical/30", dot: "bg-critical" },
  high:     { label: "High",     badge: "bg-warning/15 text-[oklch(0.85_0.16_80)] border-warning/30", dot: "bg-warning" },
  medium:   { label: "Medium",   badge: "bg-accent/15 text-[oklch(0.80_0.20_300)] border-accent/30", dot: "bg-accent" },
  low:      { label: "Low",      badge: "bg-primary/15 text-[oklch(0.85_0.14_210)] border-primary/30", dot: "bg-primary" },
  info:     { label: "Info",     badge: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { key: "new-scan",  label: "New Scan",  icon: "M12 5v14M5 12h14" },
  { key: "history",   label: "Scan History", icon: "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" },
  { key: "reports",   label: "Reports",   icon: "M9 12h6M9 16h6M7 4h10a2 2 0 012 2v14l-4-2-3 2-3-2-4 2V6a2 2 0 012-2z" },
  { key: "compliance",label: "Compliance",icon: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" },
  { key: "settings",  label: "Settings",  icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" },
];

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.origin;
  } catch {
    return null;
  }
}

function SentinelDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [url, setUrl] = useState("");
  const [scanMode, setScanMode] = useState<"quick" | "full">("quick");
  const [scanning, setScanning] = useState(false);
  const [scannedTarget, setScannedTarget] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeUrl(url), [url]);

  const startScan = () => {
    if (!normalized) return;
    setScanning(true);
    setScannedTarget(normalized);
    window.setTimeout(() => setScanning(false), 2400);
  };

  const findings: Finding[] = [
    { id: "1", title: "Missing Content-Security-Policy header", category: "Headers", severity: "high",
      description: "No CSP header detected. Increases risk of XSS by allowing arbitrary script sources." },
    { id: "2", title: "HSTS not enforced", category: "Transport", severity: "high",
      description: "Strict-Transport-Security absent; downgrade attacks possible on first visit." },
    { id: "3", title: "Cookie missing SameSite attribute", category: "Cookies", severity: "medium",
      description: "Session cookie lacks SameSite=Lax|Strict, enabling CSRF surface." },
    { id: "4", title: "Server header discloses version", category: "Exposure", severity: "low",
      description: "'Server: nginx/1.21.6' leaks exact version. Consider suppressing." },
    { id: "5", title: "TLS 1.3 supported", category: "Transport", severity: "info",
      description: "Endpoint negotiates TLS 1.3 with modern ciphers. Good." },
    { id: "6", title: "Publicly readable .git directory", category: "Exposure", severity: "critical",
      description: "Source repository metadata accessible at /.git/. Full source disclosure risk." },
  ];

  const scoreCards = [
    { label: "Overall",  value: 62, tone: "warning" as const, hint: "Needs attention" },
    { label: "SSL/TLS",  value: 91, tone: "success" as const, hint: "Grade A" },
    { label: "Headers",  value: 48, tone: "critical" as const, hint: "Grade D" },
    { label: "Cookies",  value: 74, tone: "warning" as const, hint: "Grade B" },
    { label: "Exposure", value: 58, tone: "warning" as const, hint: "Grade C" },
  ];

  const severityCounts = findings.reduce<Record<Severity, number>>(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  );

  return (
    <div className="flex min-h-screen text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-panel/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border/60">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 glow-cyan">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Sentinel AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Security Console</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="glass-panel px-3 py-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" style={{ animation: "pulse-dot 2s infinite" }} />
              Passive engine online
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/70">
              Non-intrusive checks only
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Security Overview</h1>
              <p className="text-xs text-muted-foreground">
                {scannedTarget ? `Last target: ${scannedTarget}` : "Run a scan to populate the dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              acme-corp / production
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
              SA
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Scan input */}
          <section className="glass-panel p-5 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Target URL
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 focus-within:border-primary/60 focus-within:glow-cyan transition-all">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
                    </svg>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startScan()}
                      placeholder="example.com or https://example.com"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      autoFocus
                    />
                    {url && !normalized && (
                      <span className="text-[10px] text-critical">invalid</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Mode</label>
                  <div className="mt-2 inline-flex rounded-lg border border-border bg-background/60 p-1">
                    <button
                      onClick={() => setScanMode("quick")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        scanMode === "quick" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Quick Public
                    </button>
                    <button
                      onClick={() => setScanMode("full")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        scanMode === "full" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Full (verified)
                    </button>
                  </div>
                </div>

                <button
                  onClick={startScan}
                  disabled={!normalized || scanning}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed glow-cyan"
                >
                  {scanning ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-primary-foreground" style={{ animation: "pulse-dot 1s infinite" }} />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                      Start scan
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                {scanMode === "quick"
                  ? "Quick public scan: passive headers, SSL grade, tech fingerprint. No verification needed."
                  : "Full verified scan requires DNS TXT or meta-tag ownership proof before running."}
              </p>

              {scanning && (
                <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                    style={{ animation: "scan-sweep 1.4s linear infinite" }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Score cards */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {scoreCards.map((s) => (
              <ScoreCard key={s.label} {...s} />
            ))}
          </section>

          {/* Findings + severity breakdown */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-panel p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold">Findings</h2>
                  <p className="text-xs text-muted-foreground">Passive checks · sample data</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md border border-border px-2 py-1 text-muted-foreground">All</span>
                  <span className="rounded-md border border-border px-2 py-1 text-muted-foreground">By severity</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-md border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Severity</th>
                      <th className="text-left px-3 py-2 font-medium">Finding</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f, i) => {
                      const s = SEVERITY_STYLES[f.severity];
                      return (
                        <tr key={f.id} className={`border-t border-border/40 hover:bg-muted/30 transition-colors ${i % 2 ? "bg-background/20" : ""}`}>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-widest ${s.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-foreground">{f.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{f.category}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h2 className="text-sm font-semibold">Severity Breakdown</h2>
              <p className="text-xs text-muted-foreground">Across {findings.length} findings</p>
              <div className="mt-4 space-y-3">
                {(Object.keys(SEVERITY_STYLES) as Severity[]).map((sev) => {
                  const total = findings.length || 1;
                  const pct = Math.round((severityCounts[sev] / total) * 100);
                  const s = SEVERITY_STYLES[sev];
                  return (
                    <div key={sev}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className="font-mono text-muted-foreground">{severityCounts[sev]}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${s.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-md border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-center gap-2 text-xs text-accent">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" />
                  </svg>
                  AI Risk Summary
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Sample narrative. Once connected to the AI layer, Sentinel will explain findings,
                  suggest remediation, and estimate business risk here.
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground/70 italic">
                  Generated by AI — verify before acting.
                </p>
              </div>
            </div>
          </section>

          <footer className="pt-4 pb-8 text-center text-[11px] text-muted-foreground/70">
            Sentinel AI performs only passive, non-intrusive checks. No port scanning, brute force, or exploit execution.
          </footer>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({ label, value, tone, hint }: { label: string; value: number; tone: "success" | "warning" | "critical"; hint: string }) {
  const toneColor =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-critical";
  const ringColor =
    tone === "success"
      ? "oklch(0.72 0.17 155)"
      : tone === "warning"
      ? "oklch(0.80 0.16 80)"
      : "oklch(0.62 0.24 25)";
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="glass-panel p-4 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className={`mt-1 text-2xl font-semibold font-mono ${toneColor}`}>{value}</div>
          <div className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</div>
        </div>
        <svg width="52" height="52" viewBox="0 0 48 48" className="transition-transform group-hover:scale-105">
          <circle cx="24" cy="24" r="20" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 24 24)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
      </div>
    </div>
  );
}
