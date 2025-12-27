'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import PinCard from './PinCard'
import { motion } from 'framer-motion'

interface Pin {
  id: string
  title: string
  caption: string | null
  image_url: string
  thumbnail_url: string | null
  slot_row: number | null
  slot_col: number | null
  board_id?: string
}

interface BoardGridProps {
  boardId: string
  gridCols: number
}

export default function BoardGrid({ boardId, gridCols }: BoardGridProps) {
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPins() {
      try {
        const supabase = createBrowserClient()
        
        // Fetch pins for this board
        const { data, error } = await supabase
          .from('pins')
          .select(`
            id,
            title,
            caption,
            image_url,
            thumbnail_url,
            pin_slots(row_position, col_position)
          `)
          .eq('board_id', boardId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Transform data to include slot positions
        const pinsWithSlots: Pin[] = (data || []).map((pin: any) => ({
          id: pin.id,
          title: pin.title,
          caption: pin.caption,
          image_url: pin.image_url,
          thumbnail_url: pin.thumbnail_url,
          slot_row: pin.pin_slots?.[0]?.row_position || null,
          slot_col: pin.pin_slots?.[0]?.col_position || null,
          board_id: boardId,
        }))

        setPins(pinsWithSlots)
      } catch (error) {
        console.error('Error fetching pins:', error)
      } finally {
        setLoading(false)
      }
    }

    if (boardId) {
      fetchPins()
    }
  }, [boardId])

  // Track impressions on mount
  useEffect(() => {
    if (pins.length > 0) {
      // Track impressions (lightweight, fire and forget)
      const { trackImpression, getSessionId } = require('@/lib/analytics')
      const sessionId = getSessionId()
      
      pins.forEach((pin) => {
        trackImpression(pin.id, boardId, sessionId).catch(console.error)
      })
    }
  }, [pins, boardId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
      </div>
    )
  }

  if (pins.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-body-lg text-black/70 mb-6">
          No pins on this board yet.
        </p>
        <a href="/claim" className="btn-primary inline-block">
          Be the First
        </a>
      </div>
    )
  }

  // Grid layout with gap - use explicit Tailwind classes
  const getGridColsClass = (cols: number) => {
    const mdCols = Math.min(cols + 1, 4)
    const classes: Record<number, string> = {
      1: 'grid-cols-1 md:grid-cols-2',
      2: 'grid-cols-2 md:grid-cols-3',
      3: 'grid-cols-3 md:grid-cols-4',
      4: 'grid-cols-4 md:grid-cols-4',
    }
    return classes[cols] || 'grid-cols-3 md:grid-cols-4'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`grid ${getGridColsClass(gridCols)} gap-4 md:gap-6`}
    >
      {pins.map((pin, index) => (
        <motion.div
          key={pin.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <PinCard
            pin={pin}
            onClick={() => router.push(`/pin/${pin.id}`)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

