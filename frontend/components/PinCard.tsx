'use client'

import { motion } from 'framer-motion'

interface PinCardProps {
  pin: {
    id: string
    title: string
    caption: string | null
    image_url: string
    thumbnail_url: string | null
    board_id?: string
  }
  onClick: () => void
}

export default function PinCard({ pin, onClick }: PinCardProps) {
  const handleClick = () => {
    // Track click
    const { trackClick, getSessionId } = require('@/lib/analytics')
    const sessionId = getSessionId()
    if (pin.board_id) {
      trackClick(pin.id, pin.board_id, 'pin', sessionId).catch(console.error)
    }
    onClick()
  }
  const imageUrl = pin.thumbnail_url || pin.image_url

  return (
    <motion.div
      className="card cursor-pointer overflow-hidden h-full flex flex-col"
      onClick={handleClick}
      whileHover={{ scale: 1.02, shadow: '0 10px 25px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Title at the top */}
      <div className="p-4 pb-3 border-b-2 border-black/10">
        <h3 className="text-headline-md md:text-headline-lg text-black font-display font-bold line-clamp-2">
          {pin.title}
        </h3>
      </div>

      {/* Image in the middle - full, no text overlay */}
      <div className="flex-1 relative bg-gray-100 min-h-[200px]">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={pin.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      {/* Caption/details at the bottom */}
      {pin.caption && (
        <div className="p-4 pt-3 border-t-2 border-black/10">
          <p className="text-body-sm md:text-body-md text-black/70 line-clamp-2">
            {pin.caption}
          </p>
        </div>
      )}
    </motion.div>
  )
}

