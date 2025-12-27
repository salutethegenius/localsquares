'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, FEATURED_PRICE } from '@/lib/stripe'

interface DateAvailability {
  date: string
  is_available: boolean
  booked_by_user: boolean
}

interface FeaturedBookingProps {
  boardId: string
  pinId: string
  onBook: (date: string) => Promise<void>
}

export default function FeaturedBooking({ boardId, pinId, onBook }: FeaturedBookingProps) {
  const [availability, setAvailability] = useState<DateAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [boardId])

  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/featured/availability/${boardId}?days=14`
      )
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async () => {
    if (!selectedDate) return

    setBooking(true)
    try {
      await onBook(selectedDate)
      await fetchAvailability()
      setSelectedDate(null)
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setBooking(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-headline-md font-display text-black">
          Book Featured Spot
        </h3>
        <div className="text-body-sm text-black/50">
          {formatCurrency(FEATURED_PRICE)}/day
        </div>
      </div>

      <p className="text-body-md text-black/70 mb-6">
        Get your pin featured at the top of the board for a day. Stand out from the crowd!
      </p>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {availability.map((slot) => {
          const { day, date, month } = formatDate(slot.date)
          const isSelected = selectedDate === slot.date
          const isBooked = !slot.is_available
          const isUserBooked = slot.booked_by_user

          return (
            <button
              key={slot.date}
              onClick={() => {
                if (slot.is_available) {
                  setSelectedDate(isSelected ? null : slot.date)
                }
              }}
              disabled={isBooked && !isUserBooked}
              className={`
                p-2 rounded-lg border-2 text-center transition-all
                ${isSelected
                  ? 'border-bahamian-turquoise bg-bahamian-turquoise/10'
                  : isUserBooked
                    ? 'border-bahamian-yellow bg-bahamian-yellow/10'
                    : isBooked
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-bahamian-turquoise'
                }
              `}
            >
              <div className="text-xs text-black/50">{day}</div>
              <div className="text-headline-sm font-display">{date}</div>
              <div className="text-xs text-black/50">{month}</div>
              {isUserBooked && (
                <div className="text-xs text-bahamian-yellow font-medium mt-1">
                  Yours
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-body-sm text-black/50 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-gray-200"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-200"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-bahamian-yellow/30 border-2 border-bahamian-yellow"></div>
          <span>Your booking</span>
        </div>
      </div>

      {/* Book button */}
      {selectedDate && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">
              Featured on {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="text-body-sm text-black/50">
              Your pin will appear at the top of the board
            </div>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="btn-primary"
          >
            {booking ? 'Booking...' : `Book for ${formatCurrency(FEATURED_PRICE)}`}
          </button>
        </div>
      )}
    </div>
  )
}


