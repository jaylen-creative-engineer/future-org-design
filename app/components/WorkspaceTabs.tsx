"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Segmented control + product showcase. Selecting a tab slides the pill
 * indicator (measured from the live button rects, so it tracks
 * variable-width labels) and updates the browser URL line and the active
 * sidebar item in the mockup below.
 */

type Tab = { label: string; url: string; swatch: string };

const TABS: Tab[] = [
  { label: "Baseline", url: "app.futureorg.design / baseline", swatch: "ph-1" },
  { label: "Scenarios", url: "app.futureorg.design / scenarios", swatch: "ph-4" },
  { label: "Recommendations", url: "app.futureorg.design / recommendations", swatch: "ph-3" },
  { label: "Monitoring", url: "app.futureorg.design / monitoring", swatch: "ph-2" },
  { label: "API", url: "api.futureorg.design / v1", swatch: "ph-6" }
];

export default function WorkspaceTabs() {
  const [active, setActive] = useState(0);
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });
  const trackRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const btn = btnRefs.current[active];
    if (!track || !btn) return;
    const t = track.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setIndicator({ x: b.left - t.left, w: b.width });
  }, [active]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    // Re-measure once webfonts settle (label widths can shift).
    if (typeof document !== "undefined" && "fonts" in document) {
      (document as Document & { fonts: FontFaceSet }).fonts.ready.then(measure);
    }
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const current = TABS[active];

  return (
    <>
      <div className="segmented-wrap reveal">
        <div className="segmented" role="tablist" ref={trackRef}>
          <span
            className="seg-indicator"
            style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
          />
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`seg ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="showcase reveal">
        <div className="browser-bar">
          <span className="dotrow">
            <i />
            <i />
            <i />
          </span>
          <span className="url">{current.url}</span>
        </div>
        <div className="showcase-body">
          <aside className="showcase-side">
            {TABS.map((tab, i) => (
              <div key={tab.label} className={`side-item ${i === active ? "active" : ""}`}>
                <span className={`swatch ${tab.swatch}`} />
                {tab.label}
              </div>
            ))}
          </aside>
          <div className="showcase-main">
            <div className="org-tree">
              <div className="tree-row">
                <div className="node lead">
                  <span className="avatar ph-1" /> Chief Executive
                </div>
              </div>
              <div className="tree-row">
                <div className="node">
                  <span className="avatar ph-4" /> Engineering
                </div>
                <div className="node">
                  <span className="avatar ph-3" /> Operations
                </div>
                <div className="node">
                  <span className="avatar ph-5" /> Revenue
                </div>
              </div>
              <div className="tree-row">
                <div className="node">
                  <span className="avatar ph-2" /> Platform
                </div>
                <div className="node">
                  <span className="avatar ph-6" /> Product
                </div>
                <div className="node ghost">
                  <span className="avatar ph-6" /> + proposed team
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
