import { useId, useState } from 'react'

type GemShape = 'spark' | 'diamond' | 'crown' | 'star'

type Facet = { points: string; tone: number }

const TIER_HOURS = [1, 10, 25, 50, 100, 250, 500]

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return { r: 148, g: 163, b: 184 }
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

/** tone > 0 mixes toward white, tone < 0 mixes toward black. */
function shade(hex: string, tone: number) {
  const { r, g, b } = hexToRgb(hex)
  const target = tone > 0 ? 255 : 0
  const t = Math.min(1, Math.abs(tone))
  const mix = (c: number) => Math.round(c + (target - c) * t)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function desaturate(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const gray = Math.round(r * 0.3 + g * 0.59 + b * 0.11)
  const mix = (c: number) => Math.round(c * 0.25 + gray * 0.75)
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

const SHAPES: Record<GemShape, Facet[]> = {
  spark: [
    { points: pts([[60, 12], [34, 36], [60, 46]]), tone: 0.55 },
    { points: pts([[60, 12], [86, 36], [60, 46]]), tone: 0.8 },
    { points: pts([[34, 36], [60, 46], [60, 82], [34, 78]]), tone: 0.05 },
    { points: pts([[86, 36], [60, 46], [60, 82], [86, 78]]), tone: 0.35 },
    { points: pts([[34, 78], [60, 82], [60, 108]]), tone: -0.45 },
    { points: pts([[86, 78], [60, 82], [60, 108]]), tone: -0.15 },
  ],
  diamond: [
    { points: pts([[40, 28], [80, 28], [70, 48], [50, 48]]), tone: 0.8 },
    { points: pts([[16, 48], [40, 28], [50, 48]]), tone: 0.5 },
    { points: pts([[104, 48], [80, 28], [70, 48]]), tone: 0.3 },
    { points: pts([[16, 48], [50, 48], [60, 108]]), tone: 0 },
    { points: pts([[50, 48], [70, 48], [60, 108]]), tone: 0.4 },
    { points: pts([[70, 48], [104, 48], [60, 108]]), tone: -0.4 },
  ],
  crown: octagonFacets(),
  star: starFacets(),
}

function octagonFacets(): Facet[] {
  const outer: [number, number][] = [[46, 40], [74, 40], [94, 60], [94, 84], [74, 104], [46, 104], [26, 84], [26, 60]]
  const inner: [number, number][] = [[51, 54], [69, 54], [80, 65], [80, 79], [69, 90], [51, 90], [40, 79], [40, 65]]
  const tones = [0.7, 0.45, 0.15, -0.2, -0.45, -0.25, 0.05, 0.35]
  const facets = outer.map((point, i) => {
    const next = (i + 1) % outer.length
    return { points: pts([point, outer[next], inner[next], inner[i]]), tone: tones[i] }
  })
  return [...facets, { points: pts(inner), tone: 0.55 }]
}

function starFacets(): Facet[] {
  const cx = 60
  const cy = 62
  const polar = (radius: number, step: number): [number, number] => {
    const angle = -Math.PI / 2 + (step * Math.PI) / 5
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }
  const facets: Facet[] = []
  for (let i = 0; i < 5; i++) {
    const tip = polar(50, i * 2)
    const before = polar(21, i * 2 - 1)
    const after = polar(21, i * 2 + 1)
    const lift = 0.15 * Math.cos((i * 2 * Math.PI) / 5)
    facets.push({ points: pts([[cx, cy], before, tip]), tone: 0.55 + lift })
    facets.push({ points: pts([[cx, cy], tip, after]), tone: -0.15 + lift })
  }
  return facets
}

const SPARKLES: [number, number, number][] = [
  [20, 24, 5],
  [100, 30, 4],
  [104, 92, 5],
  [14, 88, 3.5],
  [92, 12, 3],
]

function Sparkle({ x, y, size, color, delay, animate }: { x: number; y: number; size: number; color: string; delay: number; animate: boolean }) {
  const s = size
  return (
    <path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`}
      fill={color}
    >
      {animate && (
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" />
      )}
    </path>
  )
}

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  return reduced
}

export function AchievementGem({
  color,
  icon,
  requiredHours,
  locked = false,
  size = 120,
  className = '',
}: {
  color: string
  icon?: string
  requiredHours: number
  locked?: boolean
  size?: number
  className?: string
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reducedMotion = usePrefersReducedMotion()
  const shape: GemShape = icon && icon in SHAPES ? (icon as GemShape) : 'spark'
  const rank = Math.max(0, TIER_HOURS.filter((hours) => hours <= requiredHours).length - 1)
  const base = locked ? desaturate(color) : color
  const animate = !locked && !reducedMotion
  const facets = SHAPES[shape]
  const outline = shape === 'crown' ? SHAPES.crown.slice(0, 8) : facets

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={shade(base, 0.2)} stopOpacity={locked ? 0.12 : 0.55} />
          <stop offset="60%" stopColor={base} stopOpacity={locked ? 0.04 : 0.18} />
          <stop offset="100%" stopColor={base} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          {outline.map((facet, i) => (
            <polygon key={i} points={facet.points} />
          ))}
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="58" fill={`url(#${id}-glow)`} />

      {!locked && rank >= 4 && (
        <g opacity="0.35" stroke={shade(base, 0.4)} strokeWidth="1" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6
            return (
              <line
                key={i}
                x1={60 + 46 * Math.cos(angle)}
                y1={60 + 46 * Math.sin(angle)}
                x2={60 + (i % 2 ? 52 : 57) * Math.cos(angle)}
                y2={60 + (i % 2 ? 52 : 57) * Math.sin(angle)}
              />
            )
          })}
          {animate && (
            <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="40s" repeatCount="indefinite" />
          )}
        </g>
      )}

      {!locked && rank >= 3 && (
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={shade(base, 0.3)}
          strokeOpacity="0.4"
          strokeWidth="0.8"
          strokeDasharray={rank >= 5 ? '2 4' : undefined}
        />
      )}

      {!locked && <ellipse cx="60" cy="112" rx="26" ry="3" fill={shade(base, -0.6)} opacity="0.45" />}

      <g opacity={locked ? 0.4 : 1}>
        {facets.map((facet, i) => (
          <polygon
            key={i}
            points={facet.points}
            fill={shade(base, facet.tone)}
            stroke={shade(base, locked ? 0.25 : 0.65)}
            strokeOpacity={locked ? 0.5 : 0.7}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        ))}

        {shape === 'crown' && (
          <path
            d="M36 36 L40 16 L50 27 L60 12 L70 27 L80 16 L84 36 Z"
            fill={shade(base, 0.55)}
            stroke={shade(base, 0.8)}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        )}

        {!locked && (
          <g clipPath={`url(#${id}-clip)`}>
            <rect x="0" y="0" width="120" height="120" fill={`url(#${id}-shine)`} />
            {animate && (
              <rect x="-60" y="0" width="22" height="120" fill="#fff" opacity="0.28" transform="skewX(-20)">
                <animate attributeName="x" values="-60;160" dur="3.6s" begin="1s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        )}
      </g>

      {!locked &&
        SPARKLES.slice(0, Math.min(SPARKLES.length, rank + 1)).map(([x, y, s], i) => (
          <Sparkle key={i} x={x} y={y} size={s} color={shade(base, 0.75)} delay={i * 0.45} animate={animate} />
        ))}
    </svg>
  )
}
