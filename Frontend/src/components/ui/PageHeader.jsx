import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Standardized PageHeader component
 * Ensures consistent typography, spacing, semantic hierarchy, and back-navigation across all pages.
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  backTo,
  backLabel = 'Back',
  actions,
  className,
  titleClassName,
}) {
  return (
    <header className={cn('mb-8 sm:mb-10', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="page-back-link group focus-ring rounded-lg px-1 py-0.5"
          aria-label={backLabel}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          {badge && (
            <div className="mb-2">
              {typeof badge === 'string' ? (
                <span className="label-mono">{badge}</span>
              ) : (
                badge
              )}
            </div>
          )}

          <h1 className={cn('page-header-title', titleClassName)}>
            {title}
          </h1>

          {subtitle && (
            <p className="page-header-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

export default PageHeader
