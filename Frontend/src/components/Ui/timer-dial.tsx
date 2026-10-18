
import { useId, type ReactNode } from "react"

const VIEWBOX = 224
const STROKE = 7
const RADIUS = 99
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface TimerDialProps {
  progress?: number
  finished?: boolean
  children: ReactNode
}

export function TimerDial({
  progress = 0,
  finished = false,
  children,
}: TimerDialProps) {
  const gradientId = useId()
  const clamped = Math.min(100, Math.max(0, progress))
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE
  const angle = (clamped / 100) * 2 * Math.PI

  return (
    <div className="timer-dial" data-finished={finished}>
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--timer-accent-soft)"
            />
            <stop
              offset="38%"
              stopColor="var(--timer-accent)"
            />
            <stop
              offset="100%"
              stopColor="var(--timer-accent)"
            />
          </linearGradient>
        </defs>

        <circle
          cx="112"
          cy="112"
          r="111"
          fill="none"
          stroke="var(--timer-outline)"
          strokeWidth="1"
        />

        <circle
          cx="112"
          cy="112"
          r={RADIUS}
          fill="none"
          stroke="var(--timer-track)"
          strokeWidth={STROKE}
        />

        {clamped > 0 && (
          <>
            <circle
              cx="112"
              cy="112"
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />

            <circle
              cx={112 + RADIUS * Math.cos(angle)}
              cy={112 + RADIUS * Math.sin(angle)}
              r="3.5"
              fill="var(--timer-highlight)"
              className="timer-progress-tip"
            />
          </>
        )}
      </svg>

      <div className="timer-dial-content">{children}</div>
    </div>
  )
}
