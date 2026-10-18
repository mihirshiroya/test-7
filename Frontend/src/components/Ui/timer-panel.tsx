
"use client"

import { useRef } from "react"

import {
  Play,
  CheckCircle2,
  PauseCircle,
} from "lucide-react"

import { TimerRobot } from "./timer-robot"
import { TimerDial } from "./timer-dial"

import {
  useActiveTask,
  useTaskStore,
  formatDuration,
  taskSpentSeconds,
  isTaskStartAllowed,
} from "../../store/slices/taskSlice"

interface TimerPanelProps {
  workspaceId?: string | null
  compact?: boolean
}

export function TimerPanel({
  workspaceId = null,
  compact = false,
}: TimerPanelProps) {
  const {
    tasks,
    timer,
    workspaces,
    startTask,
    holdTask,
    completeTask,
  } = useTaskStore()

  const {
    activeTask: active,
    remainingSeconds: remaining,
    spentSeconds: spent,
  } = useActiveTask()

  const onHoldRef = useRef<HTMLDivElement>(null)

  const hasActiveTask = !!timer.taskId

  const timerText = active
    ? formatDuration(Math.max(0, remaining))
    : "00:00"

  const onHold = tasks
    .filter(
      (task) =>
        task.status === "ON_HOLD" &&
        (!workspaceId || task.workspaceId === workspaceId),
    )
    .sort((a, b) => a.position - b.position)

  const resumableTask = onHold.find((task) =>
    isTaskStartAllowed(tasks, timer, task.id),
  )

  const pct =
    active && active.plannedDurationSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (spent / active.plannedDurationSeconds) * 100,
          ),
        )
      : 0

  const isFinished = remaining <= 0

  const activeWorkspace = active
    ? workspaces.find((w) => w.id === active.workspaceId)
    : null

  /*
   * ============================
   * COMPACT TIMER
   * ============================
   */
  if (compact) {
    return (
      <span
        className="
          font-mono
          text-sm
          font-medium
          tabular-nums
          tracking-tight
          text-foreground
        "
      >
        {hasActiveTask
          ? formatDuration(Math.max(0, remaining))
          : "00:00"}
      </span>
    )
  }

  return (
    <section
      aria-label="Focus timer"
      className="
        flex
        h-full
        min-h-0
        flex-col
        overflow-y-auto
        bg-canvas
      "
    >
      {/* TIMER CARD */}
      <div className="flex shrink-0 flex-col gap-4 p-4">
        {/* Task / workspace */}
        <div className="flex h-10 min-w-0 flex-col items-center justify-center gap-1 text-center">
          <span
            className="w-full truncate text-[9px] font-medium uppercase tracking-widest text-muted-foreground"
            title={activeWorkspace?.name}
          >
            {active
              ? activeWorkspace?.name ?? "Workspace"
              : "Ready when you are"}
          </span>

          <p
            className="w-full truncate text-xs font-medium text-foreground"
            title={active?.title}
          >
            {active?.title ?? "No active task"}
          </p>
        </div>

        {/* Timer face */}
        <div className="face">
          <TimerDial
            progress={pct}
            finished={!!active && isFinished}
          >
            <TimerRobot size={30} />

            <span
              className="time"
              data-long={timerText.length > 5}
              aria-label={`${timerText} remaining`}
            >
              {timerText}
            </span>

            <div className="indicators" aria-hidden="true">
              {[0, 1, 2, 3].map((step) => (
                <span
                  key={step}
                  data-lit={!!active && pct >= step * 25}
                />
              ))}
            </div>

            <span className="mode">
              {!active
                ? "Standby"
                : timer.phase === "paused"
                  ? "Paused"
                  : isFinished
                    ? "Time's up"
                    : "Focus"}
            </span>
          </TimerDial>

          {/* Timer controls */}
          <div className="controls">
            <button
              type="button"
              className="roundButton"
              aria-label="View on-hold tasks"
              title="On-hold tasks"
              onClick={() =>
                onHoldRef.current?.scrollIntoView({
                  block: "nearest",
                })
              }
            >
              <PauseCircle size={16} />
            </button>

            <button
              type="button"
              className="mainButton"
              disabled={!active && !resumableTask}
              onClick={() =>
                active
                  ? holdTask(active.id)
                  : resumableTask && startTask(resumableTask.id)
              }
            >
              {active
                ? "Pause"
                : resumableTask
                  ? "Resume"
                  : "Ready"}
            </button>

            <button
              type="button"
              className="roundButton"
              aria-label="Complete task"
              title="Complete task"
              disabled={!active}
              onClick={() =>
                active && completeTask(active.id)
              }
            >
              <CheckCircle2 size={16} />
            </button>
          </div>
        </div>

        {/* Timer statistics */}
        <div className="flex h-4 shrink-0 items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span>
            <strong className="font-mono font-medium text-foreground">
              {formatDuration(active ? spent : 0)}
            </strong>{" "}
            spent
          </span>

          <span
            aria-hidden="true"
            className="h-3 w-px bg-border"
          />

          <span>
            <strong className="font-mono font-medium text-foreground">
              {formatDuration(
                active?.plannedDurationSeconds ?? 0,
              )}
            </strong>{" "}
            planned
          </span>
        </div>

        <p className="flex h-8 items-center justify-center text-center text-[11px] leading-4 text-muted-foreground">
          {active
            ? "One task. Your full attention."
            : "Resume an on-hold task or move one into progress."}
        </p>
      </div>

      {/* ON-HOLD TASKS */}
      <div
        ref={onHoldRef}
        className="
          mt-auto
          border-t
          border-soft
          bg-muted/20
          px-3
          py-3
        "
      >
        <div className="mb-2 flex items-center gap-1.5">
          <PauseCircle
            size={14}
            className="text-warning"
          />

          <span className="text-xs font-semibold text-foreground">
            On hold
          </span>

          <span className="text-[10px] text-muted-foreground">
            {onHold.length}
          </span>
        </div>

        {onHold.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">
            Nothing on hold.
          </p>
        ) : (
          <ul
            className="
              flex
              max-h-28
              flex-col
              gap-1.5
              overflow-y-auto
            "
          >
            {onHold.map((task) => {
              const rem = Math.max(
                0,
                task.plannedDurationSeconds -
                  taskSpentSeconds(task, timer),
              )

              const canResumeNow = isTaskStartAllowed(
                tasks,
                timer,
                task.id,
              )

              return (
                <li
                  key={task.id}
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-2
                    border
                    border-soft
                    bg-card
                    px-2.5
                    py-2
                  "
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-foreground">
                      {task.title}
                    </p>

                    <p className="text-[9px] tabular-nums text-muted-foreground">
                      {formatDuration(rem)} left
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startTask(task.id)}
                    disabled={
                      hasActiveTask && !canResumeNow
                    }
                    className="
                      flex
                      h-7
                      shrink-0
                      items-center
                      gap-1
                      rounded-md
                      bg-primary
                      px-2
                      text-[10px]
                      font-medium
                      text-primary-foreground
                      transition-opacity
                      hover:opacity-90
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <Play size={11} />
                    Resume
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {hasActiveTask && onHold.length > 0 && (
          <p className="mt-2 text-[9px] text-muted-foreground">
            Pause or complete the current task to resume another.
          </p>
        )}
      </div>
    </section>
  )
}
