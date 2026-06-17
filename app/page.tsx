import Motion from "./components/Motion.js";
import WorkspaceTabs from "./components/WorkspaceTabs.js";
import {
  Arrow,
  ApiIcon,
  Bolt,
  Check,
  DiffIcon,
  MonitorIcon,
  OrgIcon,
  RecIcon,
  ScenarioIcon,
  ShieldIcon
} from "./components/icons.js";

const loopStages = [
  { idx: "01", title: "Analyze", desc: "Ingest formal structure and metric signals into a living org model." },
  { idx: "02", title: "Design", desc: "Fork what-if scenarios, edit nodes and reporting lines, diff vs baseline." },
  { idx: "03", title: "Plan", desc: "Score alternatives on cost, span and risk — then rank what wins." },
  { idx: "04", title: "Implement", desc: "Review prescriptive recommendations and accept with a full audit trail." },
  { idx: "05", title: "Monitor", desc: "Watch structural drift and before/after metrics, and feed it back in." }
];

const pillars = [
  {
    ph: "ph-1",
    label: "baseline.org",
    icon: <OrgIcon width={18} height={18} />,
    title: "Model the org as it is",
    desc: "Units, roles, assignments and reporting topology — with cycle detection, matrix edges and immutable baselines to fork from.",
    tag: "org-model-intelligence"
  },
  {
    ph: "ph-4",
    label: "scenario.diff",
    icon: <ScenarioIcon width={18} height={18} />,
    title: "Design what it could be",
    desc: "Branch the baseline into competing designs. Every edit produces a deterministic diff and an updated multi-criteria score.",
    tag: "scenario-intelligence"
  },
  {
    ph: "ph-3",
    label: "recommend.ai",
    icon: <RecIcon width={18} height={18} />,
    title: "Get told what to change",
    desc: "AI-generated structural moves with rationale, confidence and affected entities — proposed, then accepted or rejected.",
    tag: "recommendation-intelligence"
  }
];

const capabilities = [
  { icon: <MonitorIcon width={18} height={18} />, title: "Continuous monitoring", desc: "Time-stamped metric snapshots, pre/post decision windows and drift signals when reality diverges from the plan." },
  { icon: <ApiIcon width={18} height={18} />, title: "Stable API surface", desc: "Versioned REST contracts for ingest, scenarios and recommendations — with idempotency and typed errors." },
  { icon: <DiffIcon width={18} height={18} />, title: "Deterministic diffs", desc: "Added, removed and moved nodes and reporting lines — with stable entity references across runs." },
  { icon: <ShieldIcon width={18} height={18} />, title: "Pilot-ready platform", desc: "Auth, RBAC and an append-only audit log over every structural change, with correlated observability." }
];

const steps = [
  { num: "1", title: "Ingest a baseline", desc: "Push units, roles and reporting lines as JSON or CSV. Keys are normalized, duplicates merged, invalid rows quarantined with reasons." },
  { num: "2", title: "Compare scenarios", desc: "Branch the baseline into competing designs. Every edit produces a structural diff and updated scores — instantly, side by side." },
  { num: "3", title: "Decide & monitor", desc: "Accept a recommendation, capture the audit trail, then track drift and metric deltas across the decision window." }
];

export default function HomePage() {
  return (
    <>
      <Motion />

      {/* ===================== NAV ===================== */}
      <nav className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top">
            <span className="mark"><Bolt width={15} height={15} stroke="#0a0a0c" strokeWidth={2} /></span>
            Future Org Design
          </a>
          <div className="nav-pills">
            <a href="#loop">The loop</a>
            <a href="#pillars">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">How it works</a>
          </div>
          <div className="nav-cta">
            <a className="btn btn-ghost btn-sm" href="#cta">Sign in</a>
            <a className="btn btn-primary btn-sm" href="#cta">Request access</a>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <header className="hero" id="top">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><span className="dot" /> Org Design as a Service</span>
            <h1>Stop reorganizing. <span className="accent-word">Start operating.</span></h1>
            <p className="sub">
              An intelligence-first ODaaS platform that runs a closed loop — analyze, design, plan,
              implement, monitor — so structure becomes a continuous system, not a once-a-year reorg.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#cta">Start a baseline <Arrow width={16} height={16} /></a>
              <a className="btn btn-ghost" href="#loop">See the loop</a>
            </div>
            <div className="trust">
              <div className="avatars">
                <span className="ph-1" /><span className="ph-3" /><span className="ph-2" /><span className="ph-5" />
              </div>
              <span>Built for org designers, COOs and people-ops teams</span>
            </div>
          </div>

          {/* Visual collage */}
          <div className="hero-bento">
            <div className="ph ph-1 b-tall">
              <span className="ph-label">baseline org chart</span>
            </div>
            <div className="ph ph-4">
              <span className="ph-label">scenario diff</span>
            </div>
            <div className="ph ph-3">
              <span className="ph-label">recommendation</span>
            </div>
            <div className="ph ph-6 b-wide">
              <span className="ph-label">drift monitor · before / after</span>
            </div>
          </div>
        </div>
      </header>

      {/* ===================== SHOWCASE ===================== */}
      <section className="section tight">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><span className="dot" /> One workspace</span>
            <h2>Your whole org, modeled and measured</h2>
            <p>Navigate the baseline, branch a scenario, review the recommendation — without leaving the loop.</p>
          </div>

          <WorkspaceTabs />
        </div>
      </section>

      {/* ===================== PILLARS (image-topped cards) ===================== */}
      <section className="section" id="pillars">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><span className="dot" /> The three moves</span>
            <h2>See it, reshape it, decide it</h2>
            <p>Domain logic stays separate from delivery, so each capability is independently testable — and composes into one prescriptive workflow.</p>
          </div>

          <div className="grid grid-3">
            {pillars.map((p) => (
              <article className="media-card reveal" key={p.title}>
                <div className={`thumb ph ${p.ph}`} style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
                  <span className="ph-label">{p.label}</span>
                </div>
                <div className="body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <span className="tag">{p.tag}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CLOSED LOOP ===================== */}
      <section className="section" id="loop">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><span className="dot" /> The closed-loop value chain</span>
            <h2>Five stages, one continuous system</h2>
            <p>Most tools treat reorganization as a project that ends. We model it as a loop where monitoring feeds the next design pass.</p>
          </div>

          <div className="loop-track reveal">
            {loopStages.map((stage, i) => (
              <div key={stage.idx} style={{ display: "contents" }}>
                <article className="loop-node">
                  <span className="idx">{stage.idx}</span>
                  <h4>{stage.title}</h4>
                  <p>{stage.desc}</p>
                </article>
                {i < loopStages.length - 1 && <Arrow className="loop-arrow" width={20} height={20} />}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <span className="loop-caption reveal">
              <Arrow width={14} height={14} />
              Monitoring drift loops back into <b>the next recommendation run</b>
            </span>
          </div>
        </div>
      </section>

      {/* ===================== SCENARIO SPLIT ===================== */}
      <section className="section" id="scenarios">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow"><span className="dot" /> Scenario & recommendation engine</span>
            <h2 style={{ fontSize: "clamp(26px,3.4vw,38px)", margin: "18px 0 12px" }}>Model the change before you make it</h2>
            <p className="muted" style={{ fontSize: 16.5 }}>
              Fork the baseline, reshape the structure, and let deterministic scoring rank what actually
              wins on cost, span and risk — backed by an explainable recommendation artifact.
            </p>
            <ul className="feature-list">
              <li>
                <span className="bullet"><DiffIcon width={15} height={15} /></span>
                <div><h4>Deterministic structural diff</h4><p>Added, removed and moved nodes and reporting lines — with stable entity references.</p></div>
              </li>
              <li>
                <span className="bullet"><ScenarioIcon width={15} height={15} /></span>
                <div><h4>Multi-criteria scoring</h4><p>Cost and headcount proxy, span-of-control compliance and complexity risk — same inputs, same ranking.</p></div>
              </li>
              <li>
                <span className="bullet"><RecIcon width={15} height={15} /></span>
                <div><h4>Explainable recommendations</h4><p>Suggested changes, rationale and confidence — flowing through a proposed → accepted review workflow.</p></div>
              </li>
            </ul>
          </div>

          <div className="panel reveal">
            <div className="panel-bar">
              <span className="dotrow"><i /><i /><i /></span>
              <span className="title">scenario · q3-flatten-ops.json</span>
            </div>
            <div className="code">
              <div><span className="c">{"// fork of baseline @ v12 — does not mutate"}</span></div>
              <div><span className="key">scenario</span>: <span className="s">&quot;flatten-operations&quot;</span>,</div>
              <div><span className="key">state</span>: <span className="k">ready</span>,</div>
              <div><span className="key">diff</span>: {"{"}</div>
              <div>&nbsp;&nbsp;<span className="key">moved</span>: <span className="n">7</span>, <span className="key">removed</span>: <span className="n">2</span>, <span className="key">layers</span>: <span className="n">6</span> → <span className="n">4</span></div>
              <div>{"}"}</div>
              <div style={{ height: 8 }} />
              <div className="score-row"><span className="label">Cost / headcount</span><span className="bar"><span style={{ ["--w" as string]: "82%" }} /></span><span className="val">82</span></div>
              <div className="score-row"><span className="label">Span compliance</span><span className="bar"><span style={{ ["--w" as string]: "91%" }} /></span><span className="val">91</span></div>
              <div className="score-row"><span className="label">Complexity risk</span><span className="bar"><span style={{ ["--w" as string]: "68%" }} /></span><span className="val">68</span></div>
              <div style={{ height: 10 }} />
              <div><span className="c">{"// → ranked #1 of 3 candidate designs"}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CAPABILITIES ===================== */}
      <section className="section" id="capabilities">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><span className="dot" /> Capabilities</span>
            <h2>Everything the loop needs to keep running</h2>
            <p>From ingestion to audit — the supporting intelligence domains that make continuous redesign trustworthy.</p>
          </div>

          <div className="grid grid-2">
            <article className="card reveal col-span-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: 0, overflow: "hidden" }}>
              <div style={{ padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="icon"><MonitorIcon width={18} height={18} /></div>
                <h3 style={{ fontSize: 20 }}>Monitoring that closes the loop</h3>
                <p style={{ color: "var(--text-dim)", fontSize: 14.5 }}>
                  Attach time-stamped metric snapshots to any org scope, compare before/after a decision
                  window, and surface drift when the live structure diverges from the plan.
                </p>
              </div>
              <div className="ph ph-2" style={{ borderRadius: 0, border: "none", borderLeft: "1px solid var(--border)" }}>
                <span className="ph-label">metric drift · planned vs actual</span>
              </div>
            </article>

            {capabilities.slice(1).map((c) => (
              <article className="card reveal" key={c.title}>
                <div className="icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WORKFLOW ===================== */}
      <section className="section" id="workflow">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><span className="dot" /> How it works</span>
            <h2>From raw structure to monitored decision</h2>
            <p>An end-to-end vertical slice you can run today — and run again next quarter on the same model.</p>
          </div>

          <div className="grid grid-3">
            {steps.map((s) => (
              <article className="card reveal" key={s.num}>
                <div className="icon" style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="section tight">
        <div className="container">
          <div className="stats reveal">
            <div className="stat"><div className="big">5</div><div className="lbl">closed-loop stages, one model</div></div>
            <div className="stat"><div className="big">100%</div><div className="lbl">deterministic scoring under test</div></div>
            <div className="stat"><div className="big">6</div><div className="lbl">intelligence domains</div></div>
            <div className="stat"><div className="big">∞</div><div className="lbl">continuous redesign passes</div></div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="section" id="cta">
        <div className="container">
          <div className="cta reveal">
            <div className="cta-text">
              <span className="eyebrow"><span className="dot" /> Pilot access</span>
              <h2>Bring your structure. We&apos;ll model the future.</h2>
              <p>Push your org and your signals. We&apos;ll score the options and keep watching after the decision lands.</p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#top">Request pilot access <Arrow width={16} height={16} /></a>
                <a className="btn btn-ghost" href="#loop">Read the design docs</a>
              </div>
            </div>
            <div className="cta-visual">
              <div className="ph ph-1"><span className="ph-label">your org, continuously redesigned</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <div className="brand">
                <span className="mark"><Bolt width={15} height={15} stroke="#0a0a0c" strokeWidth={2} /></span>
                Future Org Design
              </div>
              <p className="desc">Intelligence-first organization design as a service. Prescriptive, loop-oriented, continuous.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h5>Platform</h5>
                <a href="#loop">Closed loop</a>
                <a href="#pillars">The three moves</a>
                <a href="#scenarios">Scenarios</a>
                <a href="#capabilities">Capabilities</a>
              </div>
              <div className="footer-col">
                <h5>Domains</h5>
                <a href="#pillars">Org model</a>
                <a href="#scenarios">Recommendations</a>
                <a href="#capabilities">Monitoring</a>
                <a href="#capabilities">API contracts</a>
              </div>
              <div className="footer-col">
                <h5>Resources</h5>
                <a href="#cta">Documentation</a>
                <a href="#cta">Roadmap</a>
                <a href="#cta">Pilot program</a>
              </div>
            </div>
          </div>
          <div className="footer-base">
            <span>© 2026 Future Org Design — ODaaS</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>analyze → design → plan → implement → monitor</span>
          </div>
        </div>
      </footer>
    </>
  );
}
