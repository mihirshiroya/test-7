"use client"

import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Plus,ChevronDownIcon } from "lucide-react"
import { Button } from "./button"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"
import type { CalendarViewMode } from "../../lib/tasks"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

export function CalendarHeader({
  anchor,
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: {
  anchor: Date
  title: string
  view: CalendarViewMode
  onViewChange: (view: CalendarViewMode) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-3">

        <div>
          <h1 className="shrink-0 text-heading-3 text-primary text-balance !font-inter">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
  <DropdownMenuTrigger
    className="inline-flex font-inter! h-9 shrink-0 items-center gap-2 border border-soft bg-card/60 px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span>
      {view === "month"
        ? "M"
        : view === "week"
          ? "W"
          : "D"}
    </span>

    <ChevronDownIcon className="size-3.5 text-muted-foreground" />
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    sideOffset={6}
    className="w-32"
  >
    <DropdownMenuRadioGroup
      value={view}
      onValueChange={(value) => {
        if (value) {
          onViewChange(value as CalendarViewMode)
        }
      }}
    >
      <DropdownMenuRadioItem value="month" className="text-xs font-inter!">
        Month
      </DropdownMenuRadioItem>

      <DropdownMenuRadioItem value="week" className="text-xs font-inter!">
        Week
      </DropdownMenuRadioItem>

      <DropdownMenuRadioItem value="day" className="text-xs font-inter!">
        Day
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>

        <div className="flex items-center overflow-hidden border border-soft">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="h-8 border-x font-inter! border-soft px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
