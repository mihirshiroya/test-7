import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utills'
import { Button } from '../Ui/Button'
import {
  FOLDER_TINTS,
  FOLDER_ICONS,
  DEFAULT_TINT,
  normalizeTint,
  type TintKey,
  type IconKey,
} from './project-data'
import type { ProjectItem } from '../../pages/AppSidebar'

export type ProjectDraft = {
  name: string
  tint: TintKey
  icon: IconKey
}

export function ProjectDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: ProjectItem
  onClose: () => void
  onSubmit: (draft: ProjectDraft) => void
}) {
  const [name, setName] = useState('')
  const [tint, setTint] = useState<TintKey>(DEFAULT_TINT)
  const [icon, setIcon] = useState<IconKey>('folder')

  useEffect(() => {
    if (open) {
      setName(initial?.label ?? '')
      setTint(normalizeTint(initial?.tint))
      setIcon(initial?.icon ?? 'folder')
    }
  }, [open, initial])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const canSubmit = name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return

    onSubmit({
      name: name.trim(),
      tint,
      icon,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-background backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
        aria-describedby="project-dialog-desc"
        className="relative w-full max-w-md border border-soft bg-canvas p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="project-dialog-title"
              className="text-lg font-semibold text-ink font-inter!"
            >
              {mode === 'create' ? 'New workspace' : 'Edit workspace'}
            </h2>

            <p
              id="project-dialog-desc"
              className="mt-1 text-sm text-steel"
            >
              {mode === 'create'
                ? 'Give your workspace a name, color and icon.'
                : 'Update the workspace details.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg text-steel hover:bg-gray-tint hover:text-ink"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        {/* Name */}
        <label
          htmlFor="project-name"
          className="mb-1.5 block text-sm font-medium text-charcoal font-inter!"
        >
          Workspace name
        </label>

        <input
          id="project-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              submit()
            }
          }}
          placeholder="e.g. Website redesign"
          className="h-11 w-full border border-soft bg-background px-3.5 text-sm text-ink outline-none placeholder:text-stone focus:border-primary"
        />

        {/* Color */}
        <p className="mt-5 mb-2 text-sm font-medium text-charcoal font-inter!">
          Color
        </p>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(FOLDER_TINTS) as TintKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-label={`Color ${key}`}
              aria-pressed={tint === key}
              onClick={() => setTint(key)}
              className={cn(
                'size-8 rounded-full border transition-transform hover:scale-110',
                tint === key
                  ? 'scale-105 ring-2 ring-primary ring-offset-4'
                  : '',
              )}
              style={{
                backgroundColor: FOLDER_TINTS[key].bg,
                borderColor: FOLDER_TINTS[key].fg,
                // @ts-expect-error css var for ring offset
                '--tw-ring-offset-color': 'var(--canvas)',
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <p className="mt-5 mb-2 text-sm font-medium text-charcoal font-inter!">
          Icon
        </p>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(FOLDER_ICONS) as IconKey[]).map((key) => {
            const Icon = FOLDER_ICONS[key]
            const selected = icon === key

            return (
              <button
                key={key}
                type="button"
                aria-label={`Icon ${key}`}
                aria-pressed={selected}
                onClick={() => setIcon(key)}
                className={cn(
                  'flex size-10 items-center justify-center border border-soft transition-colors',
                  selected
                    ? 'text-primary'
                    : 'text-steel hover:bg-gray-tint hover:text-ink',
                )}
                style={{
                  backgroundColor: selected
                    ? FOLDER_TINTS[tint].bg
                    : 'transparent',
                  borderColor: selected
                    ? FOLDER_TINTS[tint].fg
                    : '',
                }}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="mt-7 flex justify-end gap-2">
          <Button
            size="lg"
            onClick={onClose}
            className="bg-background border border-soft font-inter! text-steel"
          >
            Cancel
          </Button>

          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={submit}
            className="bg-primary text-on-primary hover:bg-primary-pressed font-inter!"
          >
            {mode === 'create'
              ? 'Create workspace'
              : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
