'use client'

import { useState } from 'react'
import { formatCurrency, PLANS } from '@/lib/stripe'

interface SubscriptionStatus {
  has_subscription: boolean
  is_active: boolean
  is_trial: boolean
  plan: string | null
  days_remaining: number | null
  cancel_at_period_end: boolean
}

interface SubscriptionCardProps {
  status: SubscriptionStatus
  onUpgrade?: () => void
  onCancel?: () => void
  onReactivate?: () => void
}

export default function SubscriptionCard({
  status,
  onUpgrade,
  onCancel,
  onReactivate,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)

  if (!status.has_subscription) {
    return (
      <div className="card p-6">
        <h3 className="text-headline-md font-display text-black mb-2">
          No Active Subscription
        </h3>
        <p className="text-body-md text-black/70 mb-4">
          Start your $1 trial to get your pin on the board.
        </p>
        <button className="btn-primary w-full" onClick={onUpgrade}>
          Start $1 Trial
        </button>
      </div>
    )
  }

  const planInfo = status.plan ? PLANS[status.plan as keyof typeof PLANS] : null

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-headline-md font-display text-black">
            {status.is_trial ? 'Trial' : planInfo?.name || 'Subscription'}
          </h3>
          {status.is_active ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Inactive
            </span>
          )}
        </div>
        {planInfo && (
          <div className="text-right">
            <div className="text-headline-lg font-display text-bahamian-turquoise">
              {formatCurrency(planInfo.price)}
            </div>
            <div className="text-body-sm text-black/50">
              per {planInfo.period}
            </div>
          </div>
        )}
      </div>

      {/* Trial info */}
      {status.is_trial && status.days_remaining !== null && (
        <div className="bg-bahamian-yellow/10 border border-bahamian-yellow rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-bahamian-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-black">
              {status.days_remaining} day{status.days_remaining !== 1 ? 's' : ''} left in trial
            </span>
          </div>
          <p className="text-body-sm text-black/70 mt-1">
            After trial ends, you&apos;ll be charged $14/month.
          </p>
        </div>
      )}

      {/* Cancel warning */}
      {status.cancel_at_period_end && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-body-sm text-red-800">
            Your subscription will end at the end of the current billing period.
          </p>
          <button
            className="text-red-600 font-medium text-body-sm mt-2 hover:underline"
            onClick={async () => {
              setLoading(true)
              await onReactivate?.()
              setLoading(false)
            }}
            disabled={loading}
          >
            Reactivate subscription
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {status.plan === 'monthly' && (
          <button
            className="btn-primary flex-1"
            onClick={onUpgrade}
            disabled={loading}
          >
            Upgrade to Annual (Save $48)
          </button>
        )}
        {!status.cancel_at_period_end && status.is_active && (
          <button
            className="btn-secondary flex-1"
            onClick={async () => {
              if (confirm('Are you sure you want to cancel? Your pin will be removed from the board.')) {
                setLoading(true)
                await onCancel?.()
                setLoading(false)
              }
            }}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}


