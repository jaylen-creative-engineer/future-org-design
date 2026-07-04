/**
 * The colorful vertical-bar motif used across the editorial landing page.
 * Bars are generated deterministically (seeded pseudo-random) so server and
 * client renders always agree — no hydration drift.
 */

const PALETTE = [
  "#e8564a", "#f0883e", "#f4c542", "#8fb84a", "#3e9e6e",
  "#3aa3a0", "#4a7fd4", "#6a5ae0", "#9a55c8", "#d4569a",
  "#c0473e", "#e0a04a", "#5a6ee0", "#44b0c4", "#c46a44"
];

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

type SpectrumBarsProps = {
  count?: number;
  seed?: number;
  tall?: boolean;
  className?: string;
  /** Render on the dark band variant (slightly muted). */
  onDark?: boolean;
  /** Oscillate bar heights as a traveling wave (disabled by reduced motion). */
  animated?: boolean;
};

export default function SpectrumBars({
  count = 48,
  seed = 7,
  tall = false,
  className = "",
  onDark = false,
  animated = false
}: SpectrumBarsProps) {
  const rand = seeded(seed);
  const bars = Array.from({ length: count }, (_, i) => {
    const color = PALETTE[Math.floor(rand() * PALETTE.length)];
    const h = 28 + Math.round(rand() * 72); // 28%–100% of track height
    return { key: i, color, h };
  });

  return (
    <div
      className={`bars ${tall ? "tall" : ""} ${animated ? "animated" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      {bars.map((b) => (
        <i
          key={b.key}
          style={{
            background: b.color,
            height: `${b.h}%`,
            opacity: onDark ? 0.92 : 1,
            // Negative phase offset per bar makes the oscillation travel
            // left-to-right instead of pulsing in unison.
            ...(animated ? { animationDelay: `${-(b.key * 0.11)}s` } : undefined)
          }}
        />
      ))}
    </div>
  );
}
