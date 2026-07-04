import Motion from "./components/Motion.js";
import SpectrumBars from "./components/SpectrumBars.js";
import { Arrow, Bolt } from "./components/icons.js";
import { landingContent } from "../src/landing/landing-content.js";

const { brand, nav, primaryCta, hero, sections, processSteps, updates } = landingContent;

const section = Object.fromEntries(sections.map((s) => [s.id, s]));

type KickerProps = {
  id: keyof typeof section;
};

function Kicker({ id }: KickerProps) {
  const s = section[id];
  return (
    <span className="kicker">
      <span className="k-index">{s.index}</span>
      <span className="k-sep">/</span>
      <span className="k-name">{s.name}</span>
    </span>
  );
}

/** Section heading with the declared emphasis phrase in italic serif. */
function Heading({ id }: KickerProps) {
  const s = section[id];
  const at = s.emphasis ? s.heading.indexOf(s.emphasis) : -1;
  if (!s.emphasis || at < 0) return <h2>{s.heading}</h2>;
  return (
    <h2>
      {s.heading.slice(0, at)}
      <em>{s.emphasis}</em>
      {s.heading.slice(at + s.emphasis.length)}
    </h2>
  );
}

const SWATCH_COLORS = [
  "#e8564a", "#f0883e", "#f4c542", "#8fb84a", "#3e9e6e", "#3aa3a0", "#4a7fd4", "#6a5ae0",
  "#9a55c8", "#d4569a", "#c0473e", "#e0a04a", "#5a6ee0", "#44b0c4", "#c46a44", "#7a8a3e",
  "#2e7e9e", "#8a4ac0", "#c4527e", "#5e9e4a", "#d47844", "#4a66c0", "#3e9e8a", "#b04a56"
];

const SATELLITES = [
  { color: "#e8564a", top: "12%", left: "24%" },
  { color: "#4a7fd4", top: "20%", left: "72%" },
  { color: "#f4c542", top: "68%", left: "14%" },
  { color: "#3e9e6e", top: "78%", left: "62%" },
  { color: "#9a55c8", top: "44%", left: "84%" }
];

export default function HomePage() {
  return (
    <>
      <Motion />

      {/* ===================== NAV ===================== */}
      <nav className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#top">
            <span className="mark"><Bolt width={14} height={14} strokeWidth={2} /></span>
            {brand}
          </a>
          <div className="nav-links">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </div>
          <a className="btn btn-dark btn-sm" href={primaryCta.href}>{primaryCta.label}</a>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <header className="hero" id="top">
        <div className="container">
          <SpectrumBars count={64} seed={11} animated />
          <div style={{ height: 64 }} />
          <h1>
            {hero.lead} <em>{hero.emphasis}</em> {hero.trail}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="btn btn-dark" href={primaryCta.href}>
              {primaryCta.label} <Arrow width={15} height={15} />
            </a>
            <a className="btn btn-outline" href="#mission">Learn more</a>
          </div>
        </div>
      </header>

      {/* ===================== 01 MISSION ===================== */}
      <section className="section" id="mission">
        <div className="container">
          <Kicker id="mission" />
          <h2 className="statement reveal">
            We are an org design intelligence company.{" "}
            <span className="rest">
              Our mission is to bring structure into the real world through data, the most
              important interface to organizational decisions.
            </span>
          </h2>
        </div>
      </section>

      {/* ===================== 02 RESEARCH ===================== */}
      <section className="section" id="research">
        <div className="container">
          <Kicker id="research" />
          <div className="section-head">
            <Heading id="research" />
          </div>

          <div className="research-grid">
            <figure className="tile reveal">
              <div className="tile-media">
                <div className="spheres"><i /><i /></div>
              </div>
              <figcaption>
                Exploration
                <span>Every baseline starts as raw structure — units, roles and reporting lines, normalized and validated.</span>
              </figcaption>
            </figure>
            <figure className="tile reveal">
              <div className="tile-media">
                <div className="swatches">
                  {SWATCH_COLORS.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <figcaption>
                Balance
                <span>Deterministic scoring weighs cost, span-of-control compliance and complexity risk on the same scale.</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ===================== 03 PROOF ===================== */}
      <section className="section" id="proof">
        <div className="container">
          <Kicker id="proof" />
          <h2 className="statement reveal">
            Our platform is built for org designers, COOs, and people-ops teams{" "}
            <span className="rest">
              that work with baselines, scenarios, recommendations, and monitoring.
            </span>
          </h2>
        </div>
      </section>

      {/* ===================== 04 PLATFORM ===================== */}
      <section className="section" id="platform">
        <div className="container">
          <Kicker id="platform" />
          <div className="section-head">
            <Heading id="platform" />
          </div>

          <div className="suite-grid">
            <article className="suite-card reveal">
              <h3>Scenario Console</h3>
              <p>
                Fork the baseline into competing designs. Every edit produces a deterministic
                structural diff and an updated multi-criteria score — instantly, side by side.
              </p>
              <div className="suite-mock">
                <div className="waveform animated" aria-hidden="true">
                  {Array.from({ length: 42 }, (_, i) => (
                    <i
                      key={i}
                      style={{ height: `${22 + ((i * 37) % 58)}%`, animationDelay: `${-(i * 0.09)}s` }}
                    />
                  ))}
                </div>
                <div className="mock-rows">
                  <div className="mock-row">
                    <span>cost / headcount</span>
                    <span className="track"><i style={{ ["--w" as string]: "82%" }} /></span>
                    <span className="val">82</span>
                  </div>
                  <div className="mock-row">
                    <span>span compliance</span>
                    <span className="track"><i style={{ ["--w" as string]: "91%" }} /></span>
                    <span className="val">91</span>
                  </div>
                  <div className="mock-row">
                    <span>complexity risk</span>
                    <span className="track"><i style={{ ["--w" as string]: "68%" }} /></span>
                    <span className="val">68</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="suite-card reveal">
              <h3>Org Atlas</h3>
              <p>
                A living model of the organization as it is — with cycle detection, matrix edges
                and immutable baselines to fork from, kept honest by executable scenarios.
              </p>
              <div className="suite-mock">
                <div className="atlas" aria-hidden="true">
                  <div className="ring"><span className="core" /></div>
                  {SATELLITES.map((s) => (
                    <span
                      key={s.color}
                      className="satellite"
                      style={{ background: s.color, top: s.top, left: s.left }}
                    />
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="collage">
            <div className="shot reveal">
              <div className="shot-bar" aria-hidden="true">
                <i /><i /><i />
                <span className="url">app.futureorg.design / baseline</span>
              </div>
              <div className="org-rows">
                <div className="org-row">
                  <span className="chip lead">Chief Executive</span>
                </div>
                <div className="org-row">
                  <span className="chip"><span className="dot-sw" style={{ background: "#4a7fd4" }} />Engineering</span>
                  <span className="chip"><span className="dot-sw" style={{ background: "#f0883e" }} />Operations</span>
                  <span className="chip"><span className="dot-sw" style={{ background: "#d4569a" }} />Revenue</span>
                </div>
                <div className="org-row">
                  <span className="chip"><span className="dot-sw" style={{ background: "#3e9e6e" }} />Platform</span>
                  <span className="chip"><span className="dot-sw" style={{ background: "#6a5ae0" }} />Product</span>
                  <span className="chip ghost">+ proposed team</span>
                </div>
              </div>
            </div>

            <aside className="dialog-card reveal">
              <h4>Recommendation</h4>
              <div className="bubble">
                Flatten operations: move 7 nodes, remove 2 layers. Span compliance rises to 91.
              </div>
              <div className="bubble me">Accept — record rationale and audit trail.</div>
              <span className="meta">proposed → accepted · confidence 0.87</span>
            </aside>
          </div>

          <div style={{ height: 20 }} />

          <div className="band reveal">
            <div>
              <h3>Browse our <em>scenario engine</em> — or design one with us</h3>
              <p>Deterministic diffs, multi-criteria scoring and explainable recommendations.</p>
            </div>
            <a className="btn btn-light" href={primaryCta.href}>
              Explore the platform <Arrow width={15} height={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ===================== 05 PROCESS ===================== */}
      <section className="section" id="process">
        <div className="container">
          <Kicker id="process" />
          <div className="section-head left">
            <Heading id="process" />
          </div>

          <div className="process-grid reveal">
            {processSteps.map((step) => (
              <article className="process-step" key={step.number}>
                <span className="num">{step.number}.</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== JOIN ===================== */}
      <section className="section tight" id="join">
        <div className="container join">
          <div className="reveal">
            <h2>
              Join us to shape the <em>future</em> of org design
            </h2>
            <a className="btn btn-dark" href={primaryCta.href}>
              See open roles <Arrow width={15} height={15} />
            </a>
          </div>
          <SpectrumBars count={30} seed={23} tall animated className="reveal" />
        </div>
      </section>

      {/* ===================== 06 UPDATES ===================== */}
      <section className="section" id="updates">
        <div className="container">
          <Kicker id="updates" />
          <div className="section-head left">
            <Heading id="updates" />
          </div>

          <div className="updates-grid">
            {updates.map((u, i) => (
              <article className="update-card reveal" key={u.title}>
                <div className="thumb">
                  <SpectrumBars count={18} seed={31 + i * 7} />
                </div>
                <div className="body">
                  <span className="date">{u.date}</span>
                  <h4>{u.title}</h4>
                  <p>{u.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="invite">
            <h2>
              Interested in <em>working</em> with us?
            </h2>
            <a className="btn btn-light" href="mailto:hello@futureorg.design">
              {primaryCta.label} <Arrow width={15} height={15} />
            </a>
          </div>
          <div className="footer-base">
            <span>© 2026 {brand} — ODaaS</span>
            <span className="loop-line">analyze → design → plan → implement → monitor</span>
          </div>
        </div>
      </footer>
    </>
  );
}
