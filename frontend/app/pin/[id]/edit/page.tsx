'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import PinEditForm from '@/components/PinEditForm'

interface Pin {
  id: string
  title: string
  caption: string | null
  image_url: string
  thumbnail_url: string | null
  board_id: string
  user_id: string
  metadata: any
  status: string
  boards?: {
    slug: string
    display_name: string
  }
}

export default function EditPinPage() {
  const params = useParams()
  const router = useRouter()
  const pinId = params.id as string
  const [pin, setPin] = useState<Pin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPin() {
      try {
        const supabase = createBrowserClient()
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/claim')
          return
        }

        // Fetch the pin
        const { data, error: fetchError } = await supabase
          .from('pins')
          .select('*, boards(slug, display_name)')
          .eq('id', pinId)
          .single()

        if (fetchError) throw fetchError

        // Check ownership
        if (data.user_id !== user.id) {
          setError('You do not have permission to edit this pin')
          return
        }

        setPin(data)
      } catch (err: any) {
        console.error('Error fetching pin:', err)
        setError(err.message || 'Failed to load pin')
      } finally {
        setLoading(false)
      }
    }

    if (pinId) {
      fetchPin()
    }
  }, [pinId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-display-sm text-black font-display mb-4">
            Error
          </h1>
          <p className="text-body-md text-black/70 mb-8">
            {error}
          </p>
          <Link href="/me" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!pin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-display-sm text-black font-display mb-4">
            Pin Not Found
          </h1>
          <p className="text-body-md text-black/70 mb-8">
            This pin doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/me" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/me" className="text-white font-bold text-headline-md hover:underline">
            ← Back
          </Link>
          <h1 className="text-display-sm text-white font-display text-center flex-1">
            Edit Pin
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Edit Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-8">
          <h2 className="text-headline-xl text-black font-display mb-6">
            Edit: {pin.title}
          </h2>
          <PinEditForm pin={pin} />
        </div>
      </main>
    </div>
  )
}

