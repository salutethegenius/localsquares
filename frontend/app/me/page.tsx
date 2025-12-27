'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import SubscriptionCard from '@/components/SubscriptionCard'
import FeaturedBooking from '@/components/FeaturedBooking'

interface SubscriptionStatus {
  has_subscription: boolean
  is_active: boolean
  is_trial: boolean
  plan: string | null
  days_remaining: number | null
  cancel_at_period_end: boolean
}

// Wrapper component to handle Suspense for useSearchParams
export default function MePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
      </div>
    }>
      <MePageContent />
    </Suspense>
  )
}

function MePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [pins, setPins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [selectedPinForFeatured, setSelectedPinForFeatured] = useState<any>(null)

  useEffect(() => {
    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      // Clear the URL param
      window.history.replaceState({}, '', '/me')
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient()
        
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/claim')
          return
        }

        // Get user profile
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', profileError)
        }

        setUser(userData || authUser)

        // Get user's pins
        const { data: pinsData } = await supabase
          .from('pins')
          .select('id, title, image_url, status, view_count, click_count, created_at, board_id, boards(slug, display_name)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })

        setPins(pinsData || [])

        // Fetch subscription status
        await fetchSubscriptionStatus(authUser.id)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      const supabase = createBrowserClient()
      
      // Get subscription from database directly
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (subData) {
        const isActive = subData.status === 'active' || subData.status === 'past_due'
        const isTrial = subData.plan === 'trial'
        let daysRemaining = null
        
        if (isTrial && subData.trial_end) {
          const trialEnd = new Date(subData.trial_end)
          const now = new Date()
          daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        }

        setSubscription({
          has_subscription: true,
          is_active: isActive,
          is_trial: isTrial,
          plan: subData.plan,
          days_remaining: daysRemaining,
          cancel_at_period_end: subData.cancel_at_period_end || false
        })
      } else {
        setSubscription({
          has_subscription: false,
          is_active: false,
          is_trial: false,
          plan: null,
          days_remaining: null,
          cancel_at_period_end: false
        })
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription({
        has_subscription: false,
        is_active: false,
        is_trial: false,
        plan: null,
        days_remaining: null,
        cancel_at_period_end: false
      })
    }
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/auth')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleStartTrial = () => {
    router.push('/claim?step=payment')
  }

  const handleUpgrade = async () => {
    // TODO: Implement upgrade to annual
    alert('Upgrade to annual coming soon!')
  }

  const handleCancel = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Please sign in first')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || 'Failed to cancel subscription')
      }
      
      // Refresh subscription status
      await fetchSubscriptionStatus(session.user.id)
      alert('Subscription cancelled. It will remain active until the end of your billing period.')
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      alert(error.message || 'Failed to cancel subscription')
    }
  }

  const handleReactivate = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Please sign in first')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || 'Failed to reactivate subscription')
      }
      
      // Refresh subscription status
      await fetchSubscriptionStatus(session.user.id)
      alert('Subscription reactivated!')
    } catch (error: any) {
      console.error('Error reactivating subscription:', error)
      alert(error.message || 'Failed to reactivate subscription')
    }
  }

  const handleBookFeatured = async (date: string) => {
    if (!selectedPinForFeatured) return
    
    // TODO: Implement featured booking via API
    alert(`Book featured spot for ${date} - Coming soon!`)
    setSelectedPinForFeatured(null)
  }

  const handleToggleStatus = async (pinId: string, currentStatus: string) => {
    try {
      const supabase = createBrowserClient()
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      
      const { error } = await supabase
        .from('pins')
        .update({ status: newStatus })
        .eq('id', pinId)

      if (error) throw error

      // Refresh pins list
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: pinsData } = await supabase
          .from('pins')
          .select('id, title, image_url, status, view_count, click_count, created_at, board_id, boards(slug, display_name)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        setPins(pinsData || [])
      }
    } catch (error) {
      console.error('Error updating pin status:', error)
      alert('Failed to update pin status. Please try again.')
    }
  }

  const handleDeletePin = async (pinId: string, pinTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pinTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', pinId)

      if (error) throw error

      // Refresh pins list
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: pinsData } = await supabase
          .from('pins')
          .select('id, title, image_url, status, view_count, click_count, created_at, board_id, boards(slug, display_name)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        setPins(pinsData || [])
      }
    } catch (error) {
      console.error('Error deleting pin:', error)
      alert('Failed to delete pin. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate totals
  const totalViews = pins.reduce((sum, pin) => sum + (pin.view_count || 0), 0)
  const totalClicks = pins.reduce((sum, pin) => sum + (pin.click_count || 0), 0)
  const activePins = pins.filter(pin => pin.status === 'active').length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/explore" className="text-white font-bold text-headline-md hover:underline">
            ← Explore
          </Link>
          <h1 className="text-display-sm text-white font-display text-center flex-1">
            My Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            className="text-white font-bold text-body-md hover:underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-green-800">Payment successful! Your trial has started.</span>
            </div>
            <button onClick={() => setShowPaymentSuccess(false)} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-display-sm text-black font-display mb-2">
            {user.business_name || user.full_name || 'Welcome'}
          </h2>
          <p className="text-body-md text-black/70">
            {user.email || user.phone}
          </p>
        </div>

        {/* Subscription Card */}
        {subscription && (
          <div className="mb-8">
            <SubscriptionCard
              status={subscription}
              onUpgrade={subscription.has_subscription ? handleUpgrade : handleStartTrial}
              onCancel={handleCancel}
              onReactivate={handleReactivate}
            />
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="text-display-md text-bahamian-turquoise font-display mb-2">
              {activePins}
            </div>
            <div className="text-body-md text-black/70 font-bold">
              Active Pins
            </div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-display-md text-bahamian-yellow font-display mb-2">
              {totalViews}
            </div>
            <div className="text-body-md text-black/70 font-bold">
              Total Views
            </div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-display-md text-bahamian-turquoise font-display mb-2">
              {totalClicks}
            </div>
            <div className="text-body-md text-black/70 font-bold">
              Total Clicks
            </div>
          </div>
        </div>

        {/* Pins List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-lg text-black font-display">
              Your Pins
            </h3>
            <Link href="/claim" className="btn-primary">
              + Add Pin
            </Link>
          </div>

          {pins.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-body-lg text-black/70 mb-6">
                You don&apos;t have any pins yet.
              </p>
              <Link href="/claim" className="btn-primary inline-block">
                Create Your First Pin
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className="card p-4 hover:shadow-bold-lg transition-shadow"
                >
                  <Link href={`/pin/${pin.id}`} className="block">
                    <div className="aspect-pin w-full rounded-card overflow-hidden mb-4 bg-gray-100">
                      {pin.image_url && (
                        <img
                          src={pin.image_url}
                          alt={pin.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <h4 className="text-headline-md text-black font-display mb-2">
                      {pin.title}
                    </h4>
                    <div className="flex items-center justify-between text-body-sm text-black/60 mb-3">
                      <span className={`px-3 py-1 rounded-sign font-bold ${
                        pin.status === 'active' ? 'bg-bahamian-turquoise text-white' :
                        pin.status === 'draft' ? 'bg-gray-300 text-black' :
                        pin.status === 'paused' ? 'bg-bahamian-yellow text-black' :
                        'bg-gray-200 text-black'
                      }`}>
                        {pin.status}
                      </span>
                      <span>{pin.view_count || 0} views</span>
                    </div>
                  </Link>
                  
                  {/* Management Actions */}
                  <div className="flex gap-2 pt-3 border-t-2 border-black/10">
                    <Link
                      href={`/pin/${pin.id}/edit`}
                      className="flex-1 px-3 py-2 rounded-sign font-bold text-body-sm text-center bg-bahamian-yellow text-black border-2 border-bahamian-yellow hover:bg-yellow-400 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(pin.id, pin.status)}
                      className={`flex-1 px-3 py-2 rounded-sign font-bold text-body-sm border-2 transition-colors ${
                        pin.status === 'active'
                          ? 'bg-white text-black border-black hover:bg-gray-100'
                          : 'bg-bahamian-turquoise text-white border-bahamian-turquoise hover:bg-bahamian-turquoise/90'
                      }`}
                    >
                      {pin.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeletePin(pin.id, pin.title)}
                      className="px-3 py-2 rounded-sign font-bold text-body-sm bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Feature This Pin Button */}
                  {subscription?.is_active && pin.status === 'active' && (
                    <button
                      onClick={() => setSelectedPinForFeatured(selectedPinForFeatured?.id === pin.id ? null : pin)}
                      className="w-full mt-3 px-3 py-2 rounded-sign font-bold text-body-sm bg-gradient-to-r from-bahamian-turquoise to-bahamian-yellow text-black border-2 border-black hover:shadow-bold transition-all"
                    >
                      ⭐ Feature This Pin
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Booking Calendar */}
        {selectedPinForFeatured && subscription?.is_active && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-lg text-black font-display">
                Book Featured Spot for &quot;{selectedPinForFeatured.title}&quot;
              </h3>
              <button
                onClick={() => setSelectedPinForFeatured(null)}
                className="text-black/50 hover:text-black"
              >
                ✕ Close
              </button>
            </div>
            <FeaturedBooking
              boardId={selectedPinForFeatured.board_id}
              pinId={selectedPinForFeatured.id}
              onBook={handleBookFeatured}
            />
          </div>
        )}
      </main>
    </div>
  )
}
