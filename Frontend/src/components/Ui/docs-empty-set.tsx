import type { ReactNode } from 'react'
import { cn } from 'cn'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'
import { ThemedSvg } from '../../lib/svg-theme'
import journalRaw from '../../assets/10-journal.svg?raw'
import noResultsRaw from '../../assets/31-no-results.svg?raw'
import readingRaw from '../../assets/22-reading.svg?raw'
import ideaRaw from '../../assets/14-idea-capture.svg?raw'
import plantingRaw from '../../assets/35-planting-seeds.svg?raw'

const ILLUSTRATIONS = {
  content: journalRaw,
  search: readingRaw,
  noResults: noResultsRaw,
  sections: ideaRaw,
  topics: plantingRaw,
} as const

export type DocsEmptyVariant = keyof typeof ILLUSTRATIONS

type DocsEmptyStateProps = {
  variant: DocsEmptyVariant
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  size?: 'lg' | 'sm'
  className?: string
}

export function DocsEmptyState({
  variant,
  title,
  description,
  action,
  size = 'lg',
  className,
}: DocsEmptyStateProps) {
  const isLarge = size === 'lg'

  return (
    <Empty className={cn('border-0', isLarge ? 'gap-3 px-6 py-12' : 'gap-2 px-2 py-6', className)}>
      <EmptyHeader className={isLarge ? 'gap-2' : 'gap-1'}>
        <EmptyMedia className={isLarge ? 'mb-3' : 'mb-1'}>
          <ThemedSvg
            raw={ILLUSTRATIONS[variant]}
            ariaLabel=""
            className={cn(
              'mx-auto [&>svg]:h-full [&>svg]:w-full',
              isLarge ? 'h-40 w-40' : 'h-20 w-20',
            )}
          />
        </EmptyMedia>

        <EmptyTitle
          className={cn(
            'font-inter! text-docs-ink',
            isLarge ? 'text-lg font-bold' : 'text-xs font-semibold',
          )}
        >
          {title}
        </EmptyTitle>

        {description && (
          <EmptyDescription
            className={cn('text-pretty text-docs-muted', isLarge ? 'text-sm' : 'text-[11px] leading-relaxed')}
          >
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>

      {action && <EmptyContent className="mt-2">{action}</EmptyContent>}
    </Empty>
  )
}
