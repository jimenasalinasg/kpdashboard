import { useState, useEffect, useRef } from "react";

const BLUE = "#4a90e2";
const GREEN = "#22a05b";
const RED = "#d94f3d";
const AMBER = "#d97706";
const BG = "#f7f8fb";
const SURF = "#ffffff";
const BDR = "#e4e7f2";
const INK = "#1a1e2e";
const INK2 = "#3d4460";
const INK3 = "#8b93b8";
const BLUE_L = "#eaf2fc";
const BLUE_M = "#c2d9f7";
const BLUE_D = "#2c6cb5";

const PERIODS = [
  "1–13 Sep 2025","14–27 Sep 2025","28 Sep–11 Oct 2025","12–25 Oct 2025",
  "26 Oct–8 Nov 2025","9–22 Nov 2025","23 Nov–6 Dec 2025","7–20 Dec 2025",
  "21 Dec–3 Jan 2026","4–17 Jan 2026","18–31 Jan 2026","1–14 Feb 2026",
  "15–28 Feb 2026","1–14 Mar 2026","15–28 Mar 2026",
];

const SHORT = [
  "1 Sep","14 Sep","28 Sep","12 Oct","26 Oct","9 Nov","23 Nov","7 Dec",
  "21 Dec","4 Jan","18 Jan","1 Feb","15 Feb","1 Mar","15 Mar",
];

// sessions, users, avgTime, retention%, dropTime%, highlighted, copied, pillTop, pillBot
const RAW = [
  [157,66,20.76,0,88,248,92,"Similar projects (258)","Inst. documents (53)"],
  [496,139,26.9,26,88,308,92,null,null],
  [256,102,24.07,21,84,168,68,null,null],
  [289,119,25.92,30,86,179,87,"Similar projects (25)","Institutional documents (7)"],
  [329,115,21.09,24,90,152,57,"Similar projects (82)","Institutional documents (13)"],
  [384,149,22.15,33,83,201,53,"Similar projects (37)","Institutional Documents (5)"],
  [241,95,16.64,33,89,134,45,"Similar projects (16)","Institutional Documents (3)"],
  [351,119,23.17,16,87,116,51,"Similar projects (10)","Inst. Docs (4) / Literature (4)"],
  [119,94,15.67,32,91,161,139,"Similar projects (1)","Rest: 0"],
  [187,72,16.2,43,91,181,42,"Similar projects (5)","Institutional documents (0)"],
  [247,71,12.49,33.5,89,143,97,"Similar projects (8)","Institutional documents (1)"],
  [361,104,15.86,33.3,91,185,79,"Similar projects (26)","Institutional documents (3)"],
  [268,81,15.45,36.73,91,291,111,"Similar projects (13)","Literature (3)"],
  [235,82,27.7,38,89,199,61,"Lessons learned (19)","Inst. Documents (5)"],
  [427,178,22.2,55,91,233,177,"Similar projects (32)","Inst. Documents (7)"],
];

const DATA = RAW.map((r, i) => ({
  period: i + 1,
  label: PERIODS[i],
  short: SHORT[i],
  sessions: r[0], users: r[1], avgTime: r[2],
  retention: r[3], dropTime: r[4],
  highlighted: r[5], copied: r[6],
  engagement: r[5] + r[6],
  pillTop: r[7], pillBot: r[8],
}));

// ── useWidth ──────────────────────────────────────────────
function useWidth(ref) {
  const [w, setW] = useState(300);
  useEffect(() => {
    if (!ref.current) return;
    const measure = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect && rect.width > 0) setW(rect.width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return w;
}

// ── LineChart — fully clipped, no overflow ────────────────
function LineChart({ series, yFormat = v => Math.round(v), height = 170, highlightIdx = null }) {
  const wrap = useRef(null);
  const w = useWidth(wrap);

  const PAD = { t: 14, r: 16, b: 34, l: 46 };
  const cW = Math.max(w - PAD.l - PAD.r, 20);
  const cH = Math.max(height - PAD.t - PAD.b, 20);
  const n = DATA.length;

  const allV = series.flatMap(s => s.vals).filter(v => v != null);
  if (!allV.length) return <div ref={wrap} style={{ width: "100%", height }} />;

  const rawMax = Math.max(...allV);
  const rawMin = Math.min(...allV);
  const span = rawMax - rawMin || rawMax * 0.2 || 1;
  const maxV = rawMax + span * 0.12;
  const minV = Math.max(0, rawMin - span * 0.08);

  const xOf = i => PAD.l + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
  const yOf = v => PAD.t + cH - ((v - minV) / (maxV - minV || 1)) * cH;

  // nice ticks
  const range = maxV - minV || 1;
  const mag = Math.pow(10, Math.floor(Math.log10(range / 5)));
  const step = Math.ceil((range / 5) / mag) * mag;
  const ticks = [];
  for (let t = Math.ceil(minV / step) * step; t <= maxV + step * 0.01; t = parseFloat((t + step).toFixed(8))) {
    if (ticks.length > 8) break;
    ticks.push(t);
  }

  const clipId = `clip-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div ref={wrap} style={{ width: "100%", overflow: "hidden" }}>
      <svg
        width={w} height={height}
        style={{ display: "block", fontFamily: "inherit" }}
        // NO overflow:visible — keep everything inside
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.l} y={PAD.t} width={cW} height={cH} />
          </clipPath>
        </defs>

        {/* y gridlines + labels */}
        {ticks.map((t, i) => {
          const y = yOf(t);
          if (y < PAD.t - 1 || y > PAD.t + cH + 1) return null;
          return (
            <g key={i}>
              <line x1={PAD.l} x2={PAD.l + cW} y1={y} y2={y} stroke={BDR} strokeWidth={1} />
              <text x={PAD.l - 5} y={y + 3.5} textAnchor="end" fontSize={9} fill={INK3}>
                {yFormat(t)}
              </text>
            </g>
          );
        })}

        {/* x axis line */}
        <line x1={PAD.l} x2={PAD.l + cW} y1={PAD.t + cH} y2={PAD.t + cH} stroke={BDR} strokeWidth={1} />

        {/* x labels every 2nd point */}
        {DATA.map((d, i) => {
          if (i % 2 !== 0 && i !== n - 1) return null;
          const x = xOf(i);
          // clamp label within svg bounds
          const clamped = Math.max(PAD.l, Math.min(w - 4, x));
          return (
            <text key={i} x={clamped} y={PAD.t + cH + 16} textAnchor="middle" fontSize={8} fill={INK3}>
              {d.short}
            </text>
          );
        })}

        {/* clipped group for lines + dots + highlight */}
        <g clipPath={`url(#${clipId})`}>
          {highlightIdx != null && (
            <line
              x1={xOf(highlightIdx)} x2={xOf(highlightIdx)}
              y1={PAD.t} y2={PAD.t + cH}
              stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" opacity={0.45}
            />
          )}

          {series.map((s, si) => {
            const pts = DATA.map((_, i) => {
              const v = s.vals[i];
              return v != null ? [xOf(i), yOf(v)] : null;
            });
            const validPts = pts.filter(Boolean);
            if (!validPts.length) return null;

            let d = "";
            pts.forEach((p, i) => {
              if (!p) return;
              const prev = pts.slice(0, i).find(Boolean);
              d += `${prev ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)} `;
            });

            const firstP = validPts[0];
            const lastP = validPts[validPts.length - 1];

            return (
              <g key={si}>
                {s.area && (
                  <path
                    d={`${d}L${lastP[0].toFixed(1)},${(PAD.t + cH).toFixed(1)} L${firstP[0].toFixed(1)},${(PAD.t + cH).toFixed(1)} Z`}
                    fill={s.color} fillOpacity={0.09}
                  />
                )}
                <path d={d} fill="none" stroke={s.color} strokeWidth={2}
                  strokeLinejoin="round" strokeLinecap="round"
                  strokeDasharray={s.dash || undefined}
                />
                {pts.map((p, i) => {
                  if (!p) return null;
                  const isHL = highlightIdx === i;
                  return (
                    <circle key={i} cx={p[0]} cy={p[1]}
                      r={isHL ? 5 : 3}
                      fill={s.color}
                      stroke={isHL ? SURF : "none"}
                      strokeWidth={isHL ? 2 : 0}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ── DeltaPill — always shows "vs prev. period" ────────────
function DeltaPill({ curr, prev, invert = false, unit = "" }) {
  if (prev == null || curr == null) return null;
  const d = curr - prev;
  if (Math.abs(d) < 0.01) return (
    <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 99, background: "#eef0f5", color: INK3, fontWeight: 500 }}>
      → same as prev. period
    </span>
  );
  const up = d > 0;
  const good = invert ? !up : up;
  const abs = Math.abs(Number.isInteger(d) ? d : parseFloat(d.toFixed(1)));
  return (
    <span style={{
      fontSize: 10, padding: "2px 10px", borderRadius: 99, fontWeight: 500,
      background: good ? "#edfaf4" : "#fef0ee",
      color: good ? GREEN : RED,
    }}>
      {up ? "▲" : "▼"} {up ? "+" : "−"}{abs}{unit} vs prev. period
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, display, raw, prev, invert = false, unit = "", desc }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3, marginBottom: 9 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 500, color: INK, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>{display}</div>
      <DeltaPill curr={raw} prev={prev} invert={invert} unit={unit} />
      {desc && <div style={{ fontSize: 10, color: INK3, marginTop: 7, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

// ── ExecCard ──────────────────────────────────────────────
function ExecCard({ label, val, sub }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: INK, letterSpacing: "-0.03em", lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 10, color: INK3, marginTop: 5 }}>{sub}</div>
    </div>
  );
}

// ── ChartCard ─────────────────────────────────────────────
function ChartCard({ title, legend, children, style = {} }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 10, padding: "18px 18px 12px", overflow: "hidden", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3 }}>{title}</span>
        {legend && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {legend.map(([color, lbl, dash]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: INK3 }}>
                <svg width={16} height={8} style={{ display: "block" }}>
                  <line x1={0} y1={4} x2={16} y2={4} stroke={color} strokeWidth={2} strokeDasharray={dash || undefined} />
                </svg>
                {lbl}
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Knowledge Categories section ──────────────────────────
function KnowledgeCategories({ d, p }) {
  const hasCats = d.pillTop || d.pillBot;
  if (!hasCats) return (
    <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3, marginBottom: 8 }}>Knowledge Categories</div>
      <div style={{ fontSize: 11, color: INK3 }}>No category data for this period.</div>
    </div>
  );

  // parse "Category name (N)" → { name, count }
  const parse = (str) => {
    if (!str) return null;
    const m = str.match(/^(.+?)\s*\((\d+)\)$/);
    return m ? { name: m[1].trim(), count: parseInt(m[2]) } : { name: str, count: null };
  };

  const prevTop = p ? parse(p.pillTop) : null;
  const prevBot = p ? parse(p.pillBot) : null;
  const top = parse(d.pillTop);
  const bot = parse(d.pillBot);

  const pill = (data, prevData, isTop) => {
    if (!data) return null;
    const countDiff = (data.count != null && prevData?.count != null) ? data.count - prevData.count : null;
    const sameCategory = prevData?.name === data.name;
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        padding: "12px 14px",
        background: isTop ? BLUE_L : BG,
        border: `1px solid ${isTop ? BLUE_M : BDR}`,
        borderRadius: 8, gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: isTop ? BLUE_D : INK3, marginBottom: 4 }}>
            {isTop ? "Most accessed" : "Least accessed"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: isTop ? BLUE_D : INK2 }}>{data.name}</div>
          {data.count != null && (
            <div style={{ fontSize: 10, color: INK3, marginTop: 3 }}>{data.count} interactions</div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {countDiff !== null && (
            <div style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500,
              background: (isTop ? countDiff > 0 : countDiff < 0) ? "#edfaf4" : "#fef0ee",
              color: (isTop ? countDiff > 0 : countDiff < 0) ? GREEN : RED,
            }}>
              {countDiff > 0 ? "▲" : "▼"} {countDiff > 0 ? "+" : ""}{countDiff} vs prev. period
            </div>
          )}
          {!sameCategory && prevData && (
            <div style={{ fontSize: 9, color: INK3, marginTop: 4 }}>was: {prevData.name}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3, marginBottom: 12 }}>
        Knowledge Categories
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pill(top, prevTop, true)}
        {pill(bot, prevBot, false)}
      </div>
    </div>
  );
}

// ── OVERVIEW ─────────────────────────────────────────────
function Overview() {
  const totalS = DATA.reduce((a, d) => a + d.sessions, 0);
  const totalU = DATA.reduce((a, d) => a + d.users, 0);
  const avgRet = (DATA.reduce((a, d) => a + d.retention, 0) / DATA.length).toFixed(1);
  const totalEng = DATA.reduce((a, d) => a + d.engagement, 0);
  const avgDrop = (DATA.reduce((a, d) => a + d.dropTime, 0) / DATA.length).toFixed(1);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 56px" }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <ExecCard label="Total Sessions" val={totalS.toLocaleString()} sub={`avg ${Math.round(totalS / DATA.length)}/period`} />
        <ExecCard label="Total Users" val={totalU.toLocaleString()} sub={`${DATA.length} periods`} />
        <ExecCard label="Avg Retention" val={`${avgRet}%`} sub="returning users" />
        <ExecCard label="Avg Drop-off <10s" val={`${avgDrop}%`} sub="left in first 10s" />
        <ExecCard label="Total Engagement" val={totalEng.toLocaleString()} sub="highlights + copies" />
      </div>

      <ChartCard
        title="Sessions & Users — all periods"
        legend={[[BLUE, "Sessions", null], ["#a8c8f5", "Users", "4 3"]]}
        style={{ marginBottom: 14 }}
      >
        <LineChart
          height={190}
          yFormat={v => Math.round(v)}
          series={[
            { vals: DATA.map(d => d.sessions), color: BLUE, area: true },
            { vals: DATA.map(d => d.users), color: "#a8c8f5", dash: "4 3" },
          ]}
        />
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 14 }}>
        <ChartCard title="Retention %" legend={[[GREEN, "Retention", null]]}>
          <LineChart
            height={150}
            yFormat={v => `${Math.round(v)}%`}
            series={[{ vals: DATA.map(d => d.retention), color: GREEN, area: true }]}
          />
        </ChartCard>
        <ChartCard title="Drop-off <10s %" legend={[[RED, "Drop-off", null]]}>
          <LineChart
            height={150}
            yFormat={v => `${Math.round(v)}%`}
            series={[{ vals: DATA.map(d => d.dropTime), color: RED, area: true }]}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Content Engagement — highlights & copies"
        legend={[[BLUE, "Highlights", null], [AMBER, "Copies", "4 3"]]}
      >
        <LineChart
          height={160}
          yFormat={v => Math.round(v)}
          series={[
            { vals: DATA.map(d => d.highlighted), color: BLUE, area: true },
            { vals: DATA.map(d => d.copied), color: AMBER, dash: "4 3" },
          ]}
        />
      </ChartCard>
    </div>
  );
}

// ── BY PERIOD ─────────────────────────────────────────────
function ByPeriod({ idx }) {
  const d = DATA[idx];
  const p = idx > 0 ? DATA[idx - 1] : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 56px" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: INK3, marginBottom: 4 }}>
        Period {d.period} of {DATA.length}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: INK, letterSpacing: "-0.02em", marginBottom: 4 }}>{d.label}</div>
      <div style={{ fontSize: 11, color: INK3, marginBottom: 24 }}>
        {p
          ? <>Compared to <span style={{ color: INK2 }}>{p.label}</span></>
          : "First period — no comparison available"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KpiCard
          label="Sessions" display={d.sessions.toLocaleString()}
          raw={d.sessions} prev={p?.sessions}
          desc={`${d.users} unique users`}
        />
        <KpiCard
          label="Returning Users" display={`${d.retention}%`}
          raw={d.retention} prev={p?.retention}
          unit="pp" desc="Visited more than once"
        />
        <KpiCard
          label="Drop-off <10s" display={`${d.dropTime}%`}
          raw={d.dropTime} prev={p?.dropTime}
          invert unit="pp" desc="Left within 10 seconds"
        />
        <KpiCard
          label="Content Engagement" display={d.engagement.toLocaleString()}
          raw={d.engagement} prev={p?.engagement}
          desc={`${d.highlighted} highlights · ${d.copied} copies`}
        />
      </div>

      <ChartCard
        title="Sessions — all periods (current highlighted)"
        legend={[[BLUE, "Sessions", null]]}
        style={{ marginBottom: 16 }}
      >
        <LineChart
          height={150}
          yFormat={v => Math.round(v)}
          highlightIdx={idx}
          series={[{ vals: DATA.map(d => d.sessions), color: BLUE, area: true }]}
        />
      </ChartCard>

      <KnowledgeCategories d={d} p={p} />
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("overview");
  const [idx, setIdx] = useState(DATA.length - 1);

  const tabBtn = (label, v) => (
    <button onClick={() => setView(v)} style={{
      fontFamily: "inherit", fontSize: 11, fontWeight: 500,
      padding: "6px 14px",
      border: `1px solid ${view === v ? BLUE : BDR}`,
      borderRadius: 6, cursor: "pointer",
      letterSpacing: "0.04em", textTransform: "uppercase",
      background: view === v ? BLUE : SURF,
      color: view === v ? "#fff" : INK3,
    }}>{label}</button>
  );

  const navBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "inherit", width: 30, height: 30,
      border: `1px solid ${BDR}`, borderRadius: 6,
      background: SURF, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.3 : 1, fontSize: 14, color: INK2,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: BG, minHeight: "100vh", color: INK, fontSize: 13 }}>

      <div style={{
        background: SURF, borderBottom: `1px solid ${BDR}`,
        padding: "12px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10, flexWrap: "wrap",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, fontWeight: 500, marginBottom: 2 }}>
            IDB Knowledge Platform
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: INK }}>Biweekly Usage Report</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {tabBtn("Overview", "overview")}
          {tabBtn("By Period", "byperiod")}

          {view === "byperiod" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 10, borderLeft: `1px solid ${BDR}` }}>
              {navBtn("←", () => setIdx(i => Math.max(0, i - 1)), idx === 0)}
              <select
                value={idx}
                onChange={e => setIdx(Number(e.target.value))}
                style={{
                  fontFamily: "inherit", fontSize: 11, padding: "5px 8px",
                  border: `1px solid ${BDR}`, borderRadius: 6,
                  background: SURF, color: INK, outline: "none", maxWidth: 200,
                }}
              >
                {PERIODS.map((l, i) => <option key={i} value={i}>{i + 1}. {l}</option>)}
              </select>
              {navBtn("→", () => setIdx(i => Math.min(DATA.length - 1, i + 1)), idx === DATA.length - 1)}
            </div>
          )}
        </div>
      </div>

      {view === "overview" ? <Overview /> : <ByPeriod idx={idx} />}

      <div style={{ textAlign: "center", padding: 18, fontSize: 9, color: INK3, letterSpacing: "0.06em", borderTop: `1px solid ${BDR}` }}>
        IDB Knowledge Platform · Biweekly Operational Report · FY 2025–2026
      </div>
    </div>
  );
}
