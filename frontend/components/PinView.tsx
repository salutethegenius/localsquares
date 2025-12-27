'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PinViewProps {
  pin: {
    id: string
    title: string
    caption: string | null
    image_url: string
    metadata: any
    view_count: number
    click_count: number
    board_id?: string
  }
}

export default function PinView({ pin }: PinViewProps) {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)
  
  const metadata = pin.metadata || {}
  const contact = metadata.contact || {}
  const hours = metadata.hours || {}
  const location = metadata.location || {}
  const tags = metadata.tags || []

  const handleContactClick = (type: string, value: string) => {
    if (type === 'phone' || type === 'whatsapp') {
      window.location.href = `tel:${value}`
    } else if (type === 'email') {
      window.location.href = `mailto:${value}`
    }
    // Track click
    const { trackClick, getSessionId } = require('@/lib/analytics')
    const sessionId = getSessionId()
    const clickType = type === 'whatsapp' ? 'contact' : type as 'contact' | 'email'
    trackClick(pin.id, pin.board_id || '', clickType, sessionId).catch(console.error)
  }

  const handleWebsiteClick = () => {
    if (metadata.website) {
      window.open(metadata.website, '_blank')
      const { trackClick, getSessionId } = require('@/lib/analytics')
      const sessionId = getSessionId()
      trackClick(pin.id, pin.board_id || '', 'website', sessionId).catch(console.error)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareTitle = pin.title
    const shareText = pin.caption || `Check out ${pin.title} on LocalSquares!`

    // Track share click
    const { trackClick, getSessionId } = require('@/lib/analytics')
    const sessionId = getSessionId()
    trackClick(pin.id, pin.board_id || '', 'share', sessionId).catch(console.error)

    // Try native share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name === 'AbortError') {
          return // User cancelled, don't show copy message
        }
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShowCopiedMessage(true)
      setTimeout(() => setShowCopiedMessage(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  // Check if hours have any values
  const hasHours = Object.values(hours).some(h => h && h !== '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Image Section - Full width, image-first */}
      <div className="relative w-full aspect-[4/3] md:aspect-video bg-gray-100">
        <img
          src={pin.image_url}
          alt={pin.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-4 py-8">
        {/* Title and Caption */}
        <div className="mb-8">
          <h1 className="text-display-sm md:text-display-md text-black font-display mb-4">
            {pin.title}
          </h1>
          {pin.caption && (
            <p className="text-body-lg md:text-headline-sm text-black/80 font-bold">
              {pin.caption}
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-4 py-2 bg-bahamian-yellow text-black font-bold text-body-sm rounded-sign"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share Button */}
        <div className="mb-8">
          <button
            onClick={handleShare}
            className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share This Business
          </button>
          {showCopiedMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-body-sm text-bahamian-turquoise font-bold mt-2"
            >
              Link copied to clipboard!
            </motion.p>
          )}
        </div>

        {/* Contact Information */}
        {(contact.phone || contact.whatsapp || contact.email || metadata.website) && (
          <div className="mb-8">
            <h2 className="text-headline-md text-black font-display mb-4">
              Get in Touch
            </h2>
            <div className="flex flex-wrap gap-3">
              {contact.phone && (
                <button
                  onClick={() => handleContactClick('phone', contact.phone)}
                  className="btn-primary"
                >
                  📞 Call {contact.phone}
                </button>
              )}
              {contact.whatsapp && (
                <button
                  onClick={() => handleContactClick('whatsapp', contact.whatsapp)}
                  className="btn-secondary"
                >
                  💬 WhatsApp
                </button>
              )}
              {contact.email && (
                <button
                  onClick={() => handleContactClick('email', contact.email)}
                  className="btn-outline"
                >
                  ✉️ Email
                </button>
              )}
              {metadata.website && (
                <button
                  onClick={handleWebsiteClick}
                  className="btn-outline"
                >
                  🌐 Website
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hours */}
        {hasHours && (
          <div className="mb-8">
            <h2 className="text-headline-md text-black font-display mb-4">
              Hours
            </h2>
            <div className="space-y-2">
              {Object.entries(hours).map(([day, time]: [string, any]) => (
                time && (
                  <div key={day} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-body-md font-bold text-black capitalize">
                      {day}
                    </span>
                    <span className="text-body-md text-black/70">
                      {time}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        {location.address && (
          <div className="mb-8">
            <h2 className="text-headline-md text-black font-display mb-4">
              Location
            </h2>
            <p className="text-body-lg text-black/70">
              {location.address}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="pt-8 border-t-2 border-black/10">
          <div className="flex items-center gap-6 text-body-sm text-black/60">
            <span className="font-bold">{pin.view_count || 0} views</span>
            <span className="font-bold">{pin.click_count || 0} clicks</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
