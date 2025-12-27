'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

interface PinMetadata {
  contact?: {
    phone?: string
    whatsapp?: string
    email?: string
  }
  hours?: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  location?: {
    address?: string
  }
  website?: string
  tags?: string[]
}

interface Pin {
  id: string
  title: string
  caption: string | null
  image_url: string
  thumbnail_url: string | null
  board_id: string
  metadata: PinMetadata
  status: string
}

interface PinEditFormProps {
  pin: Pin
  onSuccess?: () => void
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

export default function PinEditForm({ pin, onSuccess }: PinEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Pin state
  const [pinTitle, setPinTitle] = useState(pin.title)
  const [pinCaption, setPinCaption] = useState(pin.caption || '')
  const [pinImage, setPinImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(pin.image_url)

  // Metadata state
  const [showContactSection, setShowContactSection] = useState(false)
  const [showHoursSection, setShowHoursSection] = useState(false)
  const [showLocationSection, setShowLocationSection] = useState(false)
  
  const [contactPhone, setContactPhone] = useState(pin.metadata?.contact?.phone || '')
  const [contactWhatsapp, setContactWhatsapp] = useState(pin.metadata?.contact?.whatsapp || '')
  const [contactEmail, setContactEmail] = useState(pin.metadata?.contact?.email || '')
  const [website, setWebsite] = useState(pin.metadata?.website || '')
  const [address, setAddress] = useState(pin.metadata?.location?.address || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(pin.metadata?.tags || [])
  const [hours, setHours] = useState({
    monday: pin.metadata?.hours?.monday || '',
    tuesday: pin.metadata?.hours?.tuesday || '',
    wednesday: pin.metadata?.hours?.wednesday || '',
    thursday: pin.metadata?.hours?.thursday || '',
    friday: pin.metadata?.hours?.friday || '',
    saturday: pin.metadata?.hours?.saturday || '',
    sunday: pin.metadata?.hours?.sunday || '',
  })

  const supabase = createBrowserClient()

  // Expand sections if they have data
  useEffect(() => {
    if (contactPhone || contactWhatsapp || contactEmail || website) {
      setShowContactSection(true)
    }
    if (Object.values(hours).some(h => h)) {
      setShowHoursSection(true)
    }
    if (address) {
      setShowLocationSection(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        return
      }

      let imageUrl = currentImageUrl
      let thumbnailUrl = pin.thumbnail_url

      // Upload new image if selected
      if (pinImage) {
        const { uploadPinImage } = await import('@/lib/image-storage')
        const uploadResult = await uploadPinImage(pinImage, user.id)
        imageUrl = uploadResult.url
        thumbnailUrl = uploadResult.thumbnailUrl || null
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

      // Update pin
      const { error: updateError } = await supabase
        .from('pins')
        .update({
          title: pinTitle,
          caption: pinCaption || null,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          metadata: metadata,
        })
        .eq('id', pin.id)
        .eq('user_id', user.id) // Ensure user owns this pin

      if (updateError) throw updateError

      setSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      } else {
        // Redirect after a short delay to show success message
        setTimeout(() => {
          router.push('/me')
        }, 1500)
      }
    } catch (err: any) {
      console.error('Error updating pin:', err)
      setError(err.message || 'Failed to update pin')
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-card">
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 text-green-700 rounded-card">
          Pin updated successfully! Redirecting...
        </div>
      )}

      {/* Current Image Preview */}
      <div className="mb-6">
        <label className="block text-body-md font-bold text-black mb-2">
          Current Image
        </label>
        <div className="w-full aspect-video rounded-card overflow-hidden bg-gray-100 mb-2">
          <img
            src={currentImageUrl}
            alt={pinTitle}
            className="w-full h-full object-cover"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setPinImage(file)
            if (file) {
              // Preview the new image
              const reader = new FileReader()
              reader.onloadend = () => {
                setCurrentImageUrl(reader.result as string)
              }
              reader.readAsDataURL(file)
            }
          }}
          className="w-full px-4 py-3 border-2 border-black/30 rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
        />
        <p className="text-body-sm text-black/60 mt-2">
          Upload a new image to replace the current one (optional)
        </p>
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
          className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
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
          className="w-full px-4 py-3 border-2 border-black rounded-sign text-body-md focus:outline-none focus:ring-2 focus:ring-bahamian-turquoise"
          placeholder="Short, bold caption (optional)"
        />
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

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

