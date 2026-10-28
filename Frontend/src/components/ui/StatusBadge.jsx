import React from 'react'
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Ban,
  ShieldCheck,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Standardized StatusBadge component
 * Normalizes status pills across Orders, Licenses, Admin tables, and Audit Logs.
 */
export function StatusBadge({
  status = '',
  label,
  icon: CustomIcon,
  size = 'md',
  className
}) {
  const normalized = String(status).toLowerCase().replace(/[\s_-]+/g, '')

  let variantClass = 'badge-neutral'
  let DefaultIcon = null
  let defaultLabel = status

  switch (normalized) {
    case 'active':
    case 'approved':
    case 'completed':
    case 'paid':
    case 'success':
    case 'verified':
      variantClass = 'badge-success'
      DefaultIcon = CheckCircle2
      defaultLabel = defaultLabel || 'Active'
      break

    case 'pending':
    case 'processing':
    case 'inreview':
      variantClass = 'badge-warning'
      DefaultIcon = Clock
      defaultLabel = defaultLabel || 'Pending'
      break

    case 'expired':
      variantClass = 'badge-warning'
      DefaultIcon = Clock
      defaultLabel = defaultLabel || 'Expired'
      break

    case 'revoked':
    case 'banned':
      variantClass = 'badge-danger'
      DefaultIcon = Ban
      defaultLabel = defaultLabel || 'Revoked'
      break

    case 'rejected':
    case 'failed':
    case 'cancelled':
    case 'canceled':
      variantClass = 'badge-danger'
      DefaultIcon = XCircle
      defaultLabel = defaultLabel || 'Failed'
      break

    case 'limitreached':
      variantClass = 'badge-warning'
      DefaultIcon = AlertTriangle
      defaultLabel = defaultLabel || 'Limit Reached'
      break

    case 'refunded':
      variantClass = 'badge-info'
      DefaultIcon = RotateCcw
      defaultLabel = defaultLabel || 'Refunded'
      break

    case 'admin':
    case 'info':
      variantClass = 'badge-info'
      DefaultIcon = ShieldCheck
      defaultLabel = defaultLabel || 'Info'
      break

    default:
      variantClass = 'badge-neutral'
      DefaultIcon = null
      defaultLabel = status || 'Unknown'
      break
  }

  const IconToRender = CustomIcon !== undefined ? CustomIcon : DefaultIcon
  const displayLabel = label || defaultLabel

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5'
  }[size] || 'text-xs px-3 py-1 gap-1.5'

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  }[size] || 'w-3.5 h-3.5'

  return (
    <span className={cn('badge-status', variantClass, sizeClasses, className)}>
      {IconToRender && (
        <IconToRender className={cn(iconSizes, 'shrink-0')} aria-hidden="true" />
      )}
      <span className="capitalize">{displayLabel}</span>
    </span>
  )
}

export default StatusBadge
