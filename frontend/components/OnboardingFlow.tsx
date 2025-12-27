'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe, formatCurrency, PLANS } from '@/lib/stripe'

type Step = 'auth' | 'business' | 'payment' | 'pin'
type AuthConfirmation = 'email' | 'phone' | null

interface PinMetadata {
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  location: {
    address: string
  }
  website: string
  tags: string[]
}

const AVAILABLE_TAGS = [
  'Restaurant',
  'Food & Drink',
  'Retail',
  'Services',
  'Beauty & Spa',
  'Health',
  'Entertainment',
  'Automotive',
  'Real Estate',
  'Professional',
  'Tourism',
  'Other'
]

// Stripe Payment Form Component (used inside Elements provider)
function StripePaymentForm({ 
  onSuccess, 
  onError,
  processing,
  setProcessing 
}: { 
  onSuccess: () => void
  onError: (msg: string) => void
  processing: boolean
  setProcessing: (v: boolean) => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    onError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/me?payment=success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        onError(confirmError.message || 'Payment failed')
        setProcessing(false)
      } else if (setupIntent?.status === 'succeeded') {
        // Payment method saved, now start the trial
        onSuccess()
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border-2 border-gray-200 rounded-card p-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary w-full"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          '💳 Pay $1 & Start Trial'
        )}
      </button>
      <p className="text-body-sm text-black/50 text-center">
        Secure payment powered by Stripe • Cancel anytime
      </p>
    </form>
  )
}

export default function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auth state
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmationSent, setConfirmationSent] = useState<AuthConfirmation>(null)
  
  // OTP state for phone auth
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')

  // Business state
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')

  // Pin state
  const [pinTitle, setPinTitle] = useState('')
  const [pinCaption, setPinCaption] = useState('')
  const [pinImage, setPinImage] = useState<File | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [boards, setBoards] = useState<Array<{id: string, slug: string, display_name: string, island_id: string | null}>>([])
  const [islands, setIslands] = useState<Array<{id: string, slug: string, display_name: string}>>([])
  const [selectedIslandId, setSelectedIslandId] = useState('')
  
  // Pin metadata state
  const [showContactSection, setShowContactSection] = useState(false)
  const [showHoursSection, setShowHoursSection] = useState(false)
  const [showLocationSection, setShowLocationSection] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [hours, setHours] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  })

  // Payment state
  const [stripeReady, setStripeReady] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [setupIntentSecret, setSetupIntentSecret] = useState<string | null>(null)
  const [loadingSetupIntent, setLoadingSetupIntent] = useState(false)

  const supabase = createBrowserClient()

  // Check URL params and auth state on mount, and listen for auth changes
  useEffect(() => {
    async function checkAuthAndStep() {
      try {
        // Check for step in URL params
        const stepParam = searchParams.get('step') as Step | null
        if (stepParam && ['auth', 'business', 'payment', 'pin'].includes(stepParam)) {
          setStep(stepParam)
        }

        // Check if user is authenticated (important after magic link redirect)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && !sessionError) {
          // User is authenticated, check if they have a profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          // Ignore "no rows" error, that just means profile doesn't exist yet
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError)
          }

          // If authenticated but no step param, determine appropriate step
          if (!stepParam) {
            if (!profile || !profile.business_name) {
              setStep('business')
            } else {
              // User has profile, check if they have pins
              const { data: pins } = await supabase
                .from('pins')
                .select('id')
                .eq('user_id', session.user.id)
                .limit(1)

              if (!pins || pins.length === 0) {
                setStep('pin')
              } else {
                // User is fully set up, redirect to dashboard
                router.push('/me')
              }
            }
          } else if (stepParam === 'business' && (!profile || !profile.business_name)) {
            // User is authenticated and on business step, stay here
            setStep('business')
          } else if (stepParam === 'payment') {
            // User is on payment step (can come from /me for existing users)
            setStep('payment')
          } else if (stepParam === 'pin' && profile && profile.business_name) {
            // User is authenticated and on pin step, stay here
            setStep('pin')
          }
        } else if (stepParam && stepParam !== 'auth') {
          // User tried to access a step but isn't authenticated
          setError('Please sign in first')
          setStep('auth')
        }
      } catch (err: any) {
        console.error('Error checking auth state:', err)
        setError(err.message || 'Failed to check authentication')
      }
    }

    checkAuthAndStep()

    // Listen for auth state changes (important for magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in via magic link or OTP
        setConfirmationSent(null)
        setShowOtpInput(false)
        const stepParam = searchParams.get('step') as Step | null
        
        // Check if they have a profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        // Ignore "no rows" error, that just means profile doesn't exist yet
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError)
        }

        if (stepParam === 'business' && (!profile || !profile.business_name)) {
          setStep('business')
          setError(null) // Clear any previous errors
        } else if (stepParam === 'pin' && profile && profile.business_name) {
          setStep('pin')
          setError(null)
        } else if (!profile || !profile.business_name) {
          setStep('business')
          setError(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setStep('auth')
        setError(null)
        setConfirmationSent(null)
        setShowOtpInput(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, router, supabase])

  // Check Stripe availability and fetch setup intent when entering payment step
  useEffect(() => {
    if (step === 'payment') {
      const initializePayment = async () => {
        // Check if Stripe is available
        const stripe = await getStripe()
        setStripeReady(!!stripe)
        
        if (!stripe) return
        
        // Fetch setup intent from backend
        setLoadingSetupIntent(true)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setPaymentError('Please sign in first')
            return
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/setup-intent`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            setSetupIntentSecret(data.client_secret)
          } else {
            // If setup intent fails, we can still use demo mode
            console.log('Setup intent not available, using demo mode')
          }
        } catch (error) {
          console.error('Error fetching setup intent:', error)
        } finally {
          setLoadingSetupIntent(false)
        }
      }
      initializePayment()
    }
  }, [step, supabase])

  // Fetch islands and boards when entering pin creation step
  useEffect(() => {
    if (step === 'pin') {
      async function fetchIslandsAndBoards() {
        try {
          // Fetch islands
          const { data: islandsData, error: islandsError } = await supabase
            .from('islands')
            .select('id, slug, display_name')
            .eq('is_active', true)
            .order('sort_order')
          
          if (!islandsError && islandsData && islandsData.length > 0) {
            setIslands(islandsData)
          }

          // Fetch all boards
          const { data: boardsData, error: boardsError } = await supabase
            .from('boards')
            .select('id, slug, display_name, island_id')
            .order('display_name')
          
          if (!boardsError) {
            setBoards(boardsData || [])
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
      fetchIslandsAndBoards()
    }
  }, [step, supabase])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { signInWithEmail } = await import('@/lib/auth')
      await signInWithEmail(email, `${window.location.origin}/claim?step=business`)
      setConfirmationSent('email')
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { signInWithPhone } = await import('@/lib/auth')
      await signInWithPhone(phone)
      setShowOtpInput(true)
      setConfirmationSent('phone')
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { verifyPhoneOTP } = await import('@/lib/auth')
      await verifyPhoneOTP(phone, otp)
      // Auth state change listener will handle the rest
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError(null)

    try {
      if (confirmationSent === 'email') {
        const { signInWithEmail } = await import('@/lib/auth')
        await signInWithEmail(email, `${window.location.origin}/claim?step=business`)
      } else if (confirmationSent === 'phone') {
        const { signInWithPhone } = await import('@/lib/auth')
        await signInWithPhone(phone)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check Supabase configuration
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase is not configured. Please check your environment variables.')
      }

      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (!session || !session.user) {
        setError('You must be logged in. Please try clicking the magic link again.')
        setStep('auth')
        setLoading(false)
        return
      }

      const user = session.user

      // Test database connectivity first with timeout
      const testPromise = supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

      const testTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection test timed out')), 5000)
      })

      const { error: testError } = await Promise.race([testPromise, testTimeout]) as any

      if (testError && testError.code !== 'PGRST116') {
        throw new Error(`Cannot connect to database: ${testError.message} (Code: ${testError.code})`)
      }

      // Use the utility function which handles upsert properly
      const { updateUserProfile } = await import('@/lib/auth')
      
      // Create a promise with timeout
      const savePromise = updateUserProfile({
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        role: 'merchant',
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 15 seconds. This usually means the database request is not completing. Check your Supabase connection and RLS policies.')), 15000)
      })

      await Promise.race([savePromise, timeoutPromise])

      // Success! Move to payment step
      setStep('payment')
    } catch (err: any) {
      console.error('Error in handleBusinessInfo:', err)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to save business info. '
      if (err.message) {
        if (err.message.includes('not configured') || err.message.includes('environment variables')) {
          errorMessage = err.message
        } else if (err.message.includes('permission') || err.message.includes('policy') || err.message.includes('RLS')) {
          errorMessage += 'Permission denied. The database may be blocking this operation. Check your Row Level Security policies.'
        } else if (err.message.includes('timeout') || err.message.includes('timed out')) {
          errorMessage = err.message
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage += 'Network error. Please check your internet connection and Supabase URL.'
        } else if (err.message.includes('unique') || err.message.includes('duplicate')) {
          errorMessage += 'This email or phone number is already in use.'
        } else {
          errorMessage += err.message
        }
      } else {
        errorMessage += 'Please check the browser console for details and try again.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePinCreation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        return
      }

      if (!pinImage) {
        setError('Please select an image')
        return
      }

      // Upload image using image storage utility
      const { uploadPinImage } = await import('@/lib/image-storage')
      const uploadResult = await uploadPinImage(pinImage, user.id)
      const thumbnailUrl = uploadResult.thumbnailUrl

      if (!selectedBoardId) {
        setError('Please select a board')
        return
      }

      // Build metadata object
      const metadata: PinMetadata = {
        contact: {
          phone: contactPhone.trim(),
          whatsapp: contactWhatsapp.trim(),
          email: contactEmail.trim(),
        },
        hours: hours,
        location: {
          address: address.trim(),
        },
        website: website.trim(),
        tags: selectedTags,
      }

      // Create pin with metadata
      const { error: pinError } = await supabase
        .from('pins')
        .insert({
          board_id: selectedBoardId,
          user_id: user.id,
          title: pinTitle,
          caption: pinCaption || null,
          image_url: uploadResult.url,
          thumbnail_url: thumbnailUrl || null,
          metadata: metadata,
          status: 'active',
        })

      if (pinError) throw pinError

      // Success! Redirect to dashboard
      router.push('/me')
    } catch (err: any) {
      setError(err.message || 'Failed to create pin')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const updateHours = (day: keyof typeof hours, value: string) => {
    setHours(prev => ({ ...prev, [day]: value }))
  }

  // Handle trial payment
  const handleStartTrial = async () => {
    setPaymentProcessing(true)
    setPaymentError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please sign in first')
      }

      // Call backend to create trial subscription
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to start trial')
      }

      // Success! Move to pin creation
      setStep('pin')
    } catch (err: any) {
      console.error('Error starting trial:', err)
      setPaymentError(err.message || 'Failed to start trial. Please try again.')
    } finally {
      setPaymentProcessing(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'auth' ? 'bg-bahamian-turquoise text-white' : 
            ['business', 'payment', 'pin'].includes(step) ? 'bg-bahamian-yellow text-black' : 'bg-gray-300 text-black'
          }`}>
            1
          </div>
          <div className={`w-8 h-1 ${['business', 'payment', 'pin'].includes(step) ? 'bg-bahamian-turquoise' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'business' ? 'bg-bahamian-turquoise text-white' :
            ['payment', 'pin'].includes(step) ? 'bg-bahamian-yellow text-black' : 'bg-gray-300 text-black'
          }`}>
            2
          </div>
          <div className={`w-8 h-1 ${['payment', 'pin'].includes(step) ? 'bg-bahamian-turquoise' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'payment' ? 'bg-bahamian-turquoise text-white' :
            step === 'pin' ? 'bg-bahamian-yellow text-black' : 'bg-gray-300 text-black'
          }`}>
            3
          </div>
          <div className={`w-8 h-1 ${step === 'pin' ? 'bg-bahamian-turquoise' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'pin' ? 'bg-bahamian-turquoise text-white' : 'bg-gray-300 text-black'
          }`}>
            4
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-card">
          {error}
        </div>
      )}

      {/* Step 1: Authentication */}
      {step === 'auth' && !confirmationSent && !showOtpInput && (
        <div className="card p-8">
          <h2 className="text-headline-xl text-black font-display mb-6">
            Sign Up or Sign In
          </h2>

          {/* Auth Method Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-3 px-4 font-bold text-headline-sm rounded-sign border-2 transition-colors ${
                authMethod === 'email'
                  ? 'bg-bahamian-turquoise text-white border-bahamian-turquoise'
                  : 'bg-white text-black border-black'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-3 px-4 font-bold text-headline-sm rounded-sign border-2 transition-colors ${
                authMethod === 'phone'
                  ? 'bg-bahamian-turquoise text-white border-bahamian-turquoise'
                  : 'bg-white text-black border-black'
              }`}
            >
              Phone
            </button>
          </div>

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailAuth}>
              <div className="mb-6">
                <label className="block text-body-md font-bold text-black mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneAuth}>
              <div className="mb-6">
                <label className="block text-body-md font-bold text-black mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                  placeholder="+1242..."
                />
                <p className="text-body-sm text-black/60 mt-2">
                  Include country code (e.g., +1242 for Bahamas)
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          <p className="text-body-sm text-black/60 mt-6 text-center">
            Already have an account? The magic link will sign you in.
          </p>
        </div>
      )}

      {/* Email Confirmation Sent Screen */}
      {step === 'auth' && confirmationSent === 'email' && (
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-bahamian-turquoise rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-headline-xl text-black font-display mb-4">
            Check Your Email
          </h2>
          <p className="text-body-lg text-black/70 mb-6">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-body-md text-black/60 mb-8">
            Click the link in your email to sign in. It may take a minute to arrive.
          </p>
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="btn-outline"
          >
            {loading ? 'Sending...' : "Didn't receive it? Resend"}
          </button>
          <button
            onClick={() => {
              setConfirmationSent(null)
              setEmail('')
            }}
            className="block mx-auto mt-4 text-body-md text-bahamian-turquoise font-bold hover:underline"
          >
            Use a different email
          </button>
        </div>
      )}

      {/* Phone OTP Input Screen */}
      {step === 'auth' && showOtpInput && (
        <div className="card p-8">
          <div className="w-20 h-20 bg-bahamian-turquoise rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-headline-xl text-black font-display mb-4 text-center">
            Enter Verification Code
          </h2>
          <p className="text-body-md text-black/70 mb-6 text-center">
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>
          
          <form onSubmit={handleOtpVerification}>
            <div className="mb-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-black rounded-sign text-headline-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="block mx-auto mt-6 text-body-md text-bahamian-turquoise font-bold hover:underline"
          >
            {loading ? 'Sending...' : "Didn't receive it? Resend"}
          </button>
          <button
            onClick={() => {
              setShowOtpInput(false)
              setConfirmationSent(null)
              setOtp('')
              setPhone('')
            }}
            className="block mx-auto mt-2 text-body-md text-black/60 hover:underline"
          >
            Use a different number
          </button>
        </div>
      )}

      {/* Step 2: Business Info */}
      {step === 'business' && (
        <div className="card p-8">
          <h2 className="text-headline-xl text-black font-display mb-6">
            Tell Us About Your Business
          </h2>

          <form onSubmit={handleBusinessInfo}>
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                placeholder="Your Business Name"
              />
            </div>

            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                placeholder="Your Full Name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Payment - Start Trial */}
      {step === 'payment' && (
        <div className="card p-8">
          <h2 className="text-headline-xl text-black font-display mb-4">
            Start Your 7-Day Trial
          </h2>
          <p className="text-body-md text-black/70 mb-6">
            Get your business on the board today for just $1.
          </p>

          {/* What's Included */}
          <div className="bg-bahamian-turquoise/10 border-2 border-bahamian-turquoise rounded-card p-6 mb-6">
            <h3 className="text-headline-md font-display text-black mb-4">
              Your Trial Includes:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-bahamian-turquoise mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-body-md"><strong>7 days free</strong> to test your pin on the board</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-bahamian-turquoise mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-body-md"><strong>Fair rotation</strong> — every pin gets equal exposure</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-bahamian-turquoise mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-body-md"><strong>Analytics dashboard</strong> to track views & clicks</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-bahamian-turquoise mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-body-md"><strong>Cancel anytime</strong> before trial ends</span>
              </li>
            </ul>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-body-md font-bold text-black">Today</div>
                <div className="text-body-sm text-black/60">One-time trial fee</div>
              </div>
              <div className="text-headline-lg font-display text-bahamian-turquoise">$1</div>
            </div>
            <div className="border-t border-gray-200 my-3"></div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-body-md font-bold text-black">After 7 days</div>
                <div className="text-body-sm text-black/60">Monthly subscription</div>
              </div>
              <div className="text-headline-md font-display text-black">$14/mo</div>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-card">
              {paymentError}
            </div>
          )}

          {/* Stripe Elements Payment Form */}
          {loadingSetupIntent ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-bahamian-turquoise" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : setupIntentSecret && stripeReady ? (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret: setupIntentSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#40E0D0',
                    colorBackground: '#ffffff',
                    colorText: '#000000',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <StripePaymentForm 
                onSuccess={() => setStep('pin')}
                onError={(msg) => setPaymentError(msg)}
                processing={paymentProcessing}
                setProcessing={setPaymentProcessing}
              />
            </Elements>
          ) : (
            <>
              {/* Demo Mode - No Stripe configured */}
              <button
                onClick={handleStartTrial}
                disabled={paymentProcessing}
                className="btn-primary w-full mb-4"
              >
                {paymentProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  '💳 Start Trial for $1'
                )}
              </button>
              <p className="text-body-sm text-black/50 text-center mb-4">
                Secure payment • Cancel anytime during trial
              </p>
            </>
          )}

          {/* Skip option */}
          <button
            onClick={() => setStep('pin')}
            className="w-full text-body-sm text-black/50 hover:text-black underline mt-4"
          >
            Skip for now and create pin first
          </button>
        </div>
      )}

      {/* Step 4: Create Pin */}
      {step === 'pin' && (
        <div className="card p-8">
          <h2 className="text-headline-xl text-black font-display mb-6">
            Create Your Pin
          </h2>

          <form onSubmit={handlePinCreation}>
            {/* Island Selection */}
            {islands.length > 0 && (
              <div className="mb-6">
                <label className="block text-body-md font-bold text-black mb-2">
                  Select Island *
                </label>
                <select
                  value={selectedIslandId}
                  onChange={(e) => {
                    setSelectedIslandId(e.target.value)
                    setSelectedBoardId('') // Reset board when island changes
                  }}
                  required
                  className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                >
                  <option value="">Choose your island...</option>
                  {islands.map((island) => (
                    <option key={island.id} value={island.id}>
                      {island.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Board/Area Selection */}
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Select Area *
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                required
                disabled={islands.length > 0 && !selectedIslandId}
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {islands.length > 0 && !selectedIslandId 
                    ? 'Select an island first...' 
                    : 'Choose your area...'}
                </option>
                {boards
                  .filter(board => !islands.length || !selectedIslandId || board.island_id === selectedIslandId)
                  .map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.display_name}
                    </option>
                  ))}
              </select>
              {boards.length === 0 && (
                <p className="text-body-sm text-black/60 mt-2">
                  Loading areas...
                </p>
              )}
            </div>

            {/* Pin Title */}
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Pin Title *
              </label>
              <input
                type="text"
                value={pinTitle}
                onChange={(e) => setPinTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                placeholder="Short, bold title"
              />
            </div>

            {/* Caption */}
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Caption
              </label>
              <textarea
                value={pinCaption}
                onChange={(e) => setPinCaption(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                placeholder="Short, bold caption (optional)"
              />
            </div>

            {/* Pin Image */}
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Pin Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPinImage(e.target.files?.[0] || null)}
                required
                className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
              />
              <p className="text-body-sm text-black/60 mt-2">
                Use a high-quality image that looks great outdoors. Max 5MB.
              </p>
            </div>

            {/* Tags Section */}
            <div className="mb-6">
              <label className="block text-body-md font-bold text-black mb-2">
                Category Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-sign text-body-sm font-bold border-2 transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-bahamian-yellow text-black border-bahamian-yellow'
                        : 'bg-white text-black border-black/30 hover:border-black'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Section (Collapsible) */}
            <div className="mb-6 border-2 border-black/20 rounded-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowContactSection(!showContactSection)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-body-md font-bold text-black">Contact Information</span>
                <span className="text-headline-sm">{showContactSection ? '−' : '+'}</span>
              </button>
              {showContactSection && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-body-sm font-bold text-black mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                      placeholder="+1242..."
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-bold text-black mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={contactWhatsapp}
                      onChange={(e) => setContactWhatsapp(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                      placeholder="+1242..."
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-bold text-black mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-bold text-black mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Business Hours Section (Collapsible) */}
            <div className="mb-6 border-2 border-black/20 rounded-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHoursSection(!showHoursSection)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-body-md font-bold text-black">Business Hours</span>
                <span className="text-headline-sm">{showHoursSection ? '−' : '+'}</span>
              </button>
              {showHoursSection && (
                <div className="p-4 space-y-3">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-24 text-body-sm font-bold text-black capitalize">{day}</span>
                      <input
                        type="text"
                        value={hours[day]}
                        onChange={(e) => updateHours(day, e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-black/30 rounded-sign text-body-sm focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                        placeholder="9am - 5pm or Closed"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Section (Collapsible) */}
            <div className="mb-8 border-2 border-black/20 rounded-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowLocationSection(!showLocationSection)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-body-md font-bold text-black">Location</span>
                <span className="text-headline-sm">{showLocationSection ? '−' : '+'}</span>
              </button>
              {showLocationSection && (
                <div className="p-4">
                  <label className="block text-body-sm font-bold text-black mb-1">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
                    placeholder="Street address, Nassau, Bahamas"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating...' : 'Create Pin'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
