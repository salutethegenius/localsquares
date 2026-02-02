'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import PinView from '@/components/PinView'
import { ALLOWED_ISLAND_SLUGS, IS_FREEPORT_MVP } from '@/lib/brand'

export default function PinPage() {
  const params = useParams()
  const pinId = params.id as string
  const [pin, setPin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPin() {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('pins')
          .select('*, board_id, boards(slug, display_name, id, island_id, islands(slug))')
          .eq('id', pinId)
          .single()

        if (error) throw error
        if (IS_FREEPORT_MVP && ALLOWED_ISLAND_SLUGS.length > 0) {
          const allowed = data?.boards?.islands?.slug && ALLOWED_ISLAND_SLUGS.includes(data.boards.islands.slug)
          if (!allowed) {
            setPin(null)
            setLoading(false)
            return
          }
        }
        setPin(data)
      } catch (error) {
        console.error('Error fetching pin:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pinId) {
      fetchPin()
    }
  }, [pinId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
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
            This pin doesn&apos;t exist.
          </p>
          <Link href="/explore" className="btn-primary inline-block">
            Explore Neighborhoods
          </Link>
        </div>
      </div>
    )
  }

  const board = pin.boards

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href={board ? `/board/${board.slug}` : '/'}
            className="text-white font-bold text-headline-md hover:underline"
          >
            ← Back
          </Link>
          <h1 className="text-display-sm text-white font-display text-center flex-1">
            {board?.display_name || 'Pin'}
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Pin View */}
      <main>
        <PinView pin={pin} />
      </main>
    </div>
  )
}

