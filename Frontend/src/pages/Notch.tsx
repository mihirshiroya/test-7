"use client"

import React, { useState } from "react"
import { X } from "lucide-react"

import {
  useActiveTask,
  useTaskStore,
  formatClock,
} from "../store/slices/taskSlice"

import { TimerPanel } from "../components/Ui/timer-panel"
import {
  RobotHead,
  useRobotPresence,
  type RobotState,
} from "../components/Ui/robot-head"
import { useAuth } from "../hooks/useAuth"
import type { TimerPhase } from "../store/slices/taskSlice"

const ROBOT_COLOR: Record<RobotState, string> = {
  idle: "#8b8f98",
  sleeping: "#6b7280",
  active: "#22c55e",
  thinking: "#f59e0b",
  listening: "#8b5cf6",
  surprised: "#f97316",
  happy: "#facc15",
  error: "#ef4444",
}

/** Maps the focus timer's live state to a robot mood. */
function getTimerRobotState({
  hasTask,
  phase,
  isStale,
  remaining,
  planned,
}: {
  hasTask: boolean
  phase: TimerPhase
  isStale: boolean
  remaining: number
  planned: number
}): RobotState {
  if (!hasTask || phase === "stopped") return "sleeping"
  if (isStale) return "listening"
  if (phase === "paused") return "idle"
  if (planned > 0 && remaining <= 0) return "happy"
  if (planned > 0 && remaining <= Math.min(60, planned * 0.1)) return "surprised"
  if (planned > 0 && remaining <= planned * 0.25) return "thinking"
  return "active"
}

interface NotchNavbarProps {
  brand?: string
  ctaLabel?: string
  ctaHref?: string
  barBg?: string
  pageBg?: string
  ctaBg?: string
  radius?: number
  /** 0–100: how solid the notch tint is (lower = more see-through glass) */
  glassOpacity?: number
  /** blur strength in px for content behind the notch */
  blur?: number
}

export default function NotchNavbar({
  brand = "Notch Buddy",
  ctaLabel = "Buy lifetime license",
  ctaHref = "#",
  barBg = "#17110F",
  pageBg = "#F5E8DF",
  ctaBg = "#FA6F45",
  radius = 16,
  glassOpacity = 55,
  blur = 16,
}: NotchNavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // --------------------------------------------------
  // IMPORTANT:
  // ALL HOOKS MUST RUN BEFORE ANY CONDITIONAL RETURN
  // --------------------------------------------------

  const { isAuthenticated } = useAuth()

  const { hasActiveTask } = useTaskStore()

  const { activeTask, timer, remainingSeconds: remaining } = useActiveTask()

  const robotState = useRobotPresence(
    getTimerRobotState({
      hasTask: hasActiveTask && Boolean(activeTask),
      phase: timer.phase,
      isStale: timer.isStale,
      remaining,
      planned: activeTask?.plannedDurationSeconds ?? 0,
    }),
    !hasActiveTask || timer.phase === "stopped",
    20000
  )

  // --------------------------------------------------
  // Authentication guard
  // --------------------------------------------------

  if (!isAuthenticated) {
    return null
  }

  // --------------------------------------------------
  // Timer
  // --------------------------------------------------

  const timerText = hasActiveTask
    ? formatClock(Math.max(0, Math.floor(remaining)))
    : "00:00"

  // --------------------------------------------------
  // SINGLE glass layer for the whole notch (left flare +
  // body + right flare). One backdrop-filter = no seams.
  // Layer is 300% of the nav width: [flare | body | flare]
  // --------------------------------------------------

  const flareCut = (side: "left" | "right") =>
    `radial-gradient(ellipse 100% 100% at ${
      side === "left" ? "0" : "100%"
    } 100%, transparent calc(100% - 1px), #000 100%)`

  // The body piece overlaps the flares by 1px on each side so
  // the mask pieces never leave a hairline gap between them.
  const notchMask = [
    "linear-gradient(#000, #000)", // body
    flareCut("left"),
    flareCut("right"),
  ].join(", ")

  const glassLayerStyle: React.CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${barBg} ${glassOpacity}%, transparent)`,
    backdropFilter: `blur(${blur}px) saturate(160%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,

    WebkitMaskImage: notchMask,
    maskImage: notchMask,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize:
      "calc(33.3333% + 2px) 100%, 33.3333% 100%, 33.3333% 100%",
    maskSize: "calc(33.3333% + 2px) 100%, 33.3333% 100%, 33.3333% 100%",
    WebkitMaskPosition: "50% 0, 0% 0, 100% 0",
    maskPosition: "50% 0, 0% 0, 100% 0",
  }

  return (
    <>
      {/* =========================
          NOTCH
      ========================== */}
      <header className="pointer-events-none fixed left-1/2 top-0 z-[9999] -translate-x-1/2">
        <nav
          className="
            pointer-events-auto
            relative
            flex
            w-fit
            max-w-[95vw]
            items-center
            gap-5
            px-4
            py-1
            shadow-none
            outline-none
          "
        >
          {/* =========================
              GLASS LAYER (body + both flares in one piece)
          ========================== */}
          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              bottom-0
              top-0
              -left-full
              w-[300%]
            "
            style={glassLayerStyle}
          />

          {/* =========================
              TIMER NOTCH BUTTON
          ========================== */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open focus timer"
            className="
              group
              relative
              flex
              h-9
              items-center
              justify-center
              gap-2
            "
          >
            <RobotHead
              state={robotState}
              size={30}
              color={ROBOT_COLOR[robotState]}
              className="-my-1"
            />

            {/* Timer */}
            <span
              className="
                font-mono
                text-[13px]
                font-medium
                tabular-nums
                tracking-tight
                text-white
              "
            >
              {timerText}
            </span>
          </button>
        </nav>
      </header>

      {/* =========================
          SIDEBAR OVERLAY (blurs the page behind the sidebar)
      ========================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[105] bg-black/20 backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =========================
          TIMER SIDEBAR
      ========================== */}
      <aside
        className={`
          fixed
          right-0
          top-0
          z-[110]
          h-dvh
          w-[390px]
          max-w-[92vw]
          border-l
          border-soft
          bg-canvas
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
        {/* =========================
            SIDEBAR HEADER
        ========================== */}
        <div
          className="
            flex
            h-14
            items-center
            justify-between
            border-b
            border-soft
            px-4
          "
        >
          <div className="flex items-center gap-2">
            {/* Timer status */}
            <div
              className={`
                h-2
                w-2
                rounded-full
                ${
                  hasActiveTask
                    ? "animate-pulse bg-green-500"
                    : "bg-muted-foreground/40"
                }
              `}
            />

            <span className="text-sm font-semibold text-foreground">
              Focus Timer
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close timer"
            className="
              flex
              size-8
              items-center
              justify-center
              rounded-lg
              text-muted-foreground
              transition-colors
              hover:bg-muted
              hover:text-foreground
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* =========================
            TIMER PANEL
        ========================== */}
        <div className="h-[calc(100dvh-56px)] overflow-hidden">
          <TimerPanel />
        </div>
      </aside>
    </>
  )
}
