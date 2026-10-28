import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from './button'

/**
 * Standardized EmptyState component
 * Provides consistent presentation for empty lists, search misses, and zero-data states.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  secondaryActionTo,
  onSecondaryAction,
  className,
}) {
  return (
    <div
      role="region"
      aria-label={title || 'No data found'}
      className={cn(
        'skeuo-card p-8 sm:p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-border/80',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4 shadow-inner ring-1 ring-primary/10">
          <Icon className="w-8 h-8 stroke-[1.75]" aria-hidden="true" />
        </div>
      )}

      {title && (
        <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actionLabel && (
            actionTo ? (
              <Button asChild className="skeuo-button skeuo-button-primary">
                <Link to={actionTo} className="inline-flex items-center gap-2">
                  {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
                  <span>{actionLabel}</span>
                </Link>
              </Button>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="skeuo-button skeuo-button-primary inline-flex items-center gap-2"
              >
                {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
                <span>{actionLabel}</span>
              </button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionTo ? (
              <Button asChild variant="outline" className="rounded-xl font-bold text-xs">
                <Link to={secondaryActionTo}>
                  {secondaryActionLabel}
                </Link>
              </Button>
            ) : (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="skeuo-button skeuo-button-outline"
              >
                {secondaryActionLabel}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState
