/**
 * Stripe client-side integration for LocalSquares
 */
import { loadStripe, Stripe } from '@stripe/stripe-js'

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get the Stripe instance (singleton pattern)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Stripe publishable key not configured')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

/**
 * Format cents to currency string
 */
export const formatCurrency = (cents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

/**
 * Subscription plan details
 */
export const PLANS = {
  trial: {
    name: 'Trial',
    price: 100, // $1
    period: '7 days',
    description: '$1 for 7-day trial, then $14/month',
  },
  monthly: {
    name: 'Monthly',
    price: 1400, // $14
    period: 'month',
    description: 'Billed monthly',
  },
  annual: {
    name: 'Annual',
    price: 12000, // $120
    period: 'year',
    description: 'Save $48/year (2 months free)',
  },
} as const

export type PlanType = keyof typeof PLANS

/**
 * Featured spot pricing
 */
export const FEATURED_PRICE = 500 // $5


