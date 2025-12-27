'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface Island {
  id: string
  name: string
  slug: string
  display_name: string
  description: string | null
}

interface Board {
  id: string
  neighborhood: string
  slug: string
  display_name: string
  description: string | null
  island_id: string | null
}

export default function HomePage() {
  const [islands, setIslands] = useState<Island[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch islands on mount
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    async function fetchIslands() {
      try {
        const supabase = createBrowserClient()
        
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setError('Connection timed out. Please check your internet connection.')
            setLoading(false)
          }
        }, 10000)

        const { data, error: fetchError } = await supabase
          .from('islands')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        clearTimeout(timeoutId)

        if (!isMounted) return

        if (fetchError) {
          console.error('Error fetching islands:', fetchError)
          // Fallback: if islands table doesn't exist yet, load boards directly
          await fetchBoardsDirectly()
        } else if (data && data.length > 0) {
          setIslands(data)
        } else {
          // No islands yet, load boards directly
          await fetchBoardsDirectly()
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Error:', err)
        // Fallback to loading boards directly
        await fetchBoardsDirectly()
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    async function fetchBoardsDirectly() {
      try {
        const supabase = createBrowserClient()
        const { data } = await supabase
          .from('boards')
          .select('*')
          .order('display_name')
        
        if (data) {
          setBoards(data)
        }
      } catch (err) {
        console.error('Error fetching boards:', err)
      }
    }

    fetchIslands()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Fetch boards when island is selected
  useEffect(() => {
    if (!selectedIsland) return

    async function fetchBoardsForIsland() {
      try {
        const supabase = createBrowserClient()
        const { data, error: fetchError } = await supabase
          .from('boards')
          .select('*')
          .eq('island_id', selectedIsland!.id)
          .order('display_name')

        if (fetchError) {
          console.error('Error fetching boards:', fetchError)
        } else {
          setBoards(data || [])
        }
      } catch (err) {
        console.error('Error fetching boards:', err)
      }
    }

    fetchBoardsForIsland()
  }, [selectedIsland])

  const handleBackToIslands = () => {
    setSelectedIsland(null)
    setBoards([])
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-6 px-4">
        <h1 className="text-display-sm md:text-display-md text-white font-display text-center">
          LocalSquares
        </h1>
        <p className="text-body-md text-white/90 text-center mt-2">
          Your Neighborhood Billboards
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="card p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-body-lg text-black/70 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : islands.length > 0 && !selectedIsland ? (
          // STEP 1: Island Selection
          <>
            <div className="text-center mb-12">
              <h2 className="text-display-sm md:text-display-md text-black font-display mb-4">
                Choose Your Island
              </h2>
              <p className="text-body-lg text-black/70 max-w-2xl mx-auto">
                Select your island to explore local businesses in your area.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {islands.map((island) => (
                <button
                  key={island.id}
                  onClick={() => setSelectedIsland(island)}
                  className="card p-8 hover:shadow-bold-lg transition-shadow duration-200 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-bahamian-turquoise/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-headline-lg md:text-headline-xl text-bahamian-turquoise font-display mb-2">
                        {island.display_name}
                      </h3>
                      {island.description && (
                        <p className="text-body-md text-black/70">
                          {island.description}
                        </p>
                      )}
                      <div className="mt-4 text-bahamian-turquoise font-bold text-body-md">
                        Explore Areas →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : selectedIsland ? (
          // STEP 2: Constituency/Area Selection
          <>
            <div className="mb-8">
              <button
                onClick={handleBackToIslands}
                className="text-bahamian-turquoise font-bold text-body-md hover:underline flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Islands
              </button>
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-bahamian-turquoise/10 px-4 py-2 rounded-full mb-4">
                <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-bahamian-turquoise font-bold">{selectedIsland.display_name}</span>
              </div>
              <h2 className="text-display-sm md:text-display-md text-black font-display mb-4">
                Choose Your Area
              </h2>
              <p className="text-body-lg text-black/70 max-w-2xl mx-auto">
                Find local businesses in your neighborhood.
              </p>
            </div>

            {boards.length === 0 ? (
              <div className="text-center py-12">
                <div className="card p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-bahamian-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-headline-lg text-black font-display mb-2">
                    Coming Soon!
                  </h3>
                  <p className="text-body-lg text-black/70">
                    We&apos;re setting up neighborhood boards for {selectedIsland.display_name}. Check back soon!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.slug}`}
                    className="card p-6 hover:shadow-bold-lg transition-shadow duration-200"
                  >
                    <h3 className="text-headline-md text-bahamian-turquoise font-display mb-2">
                      {board.display_name}
                    </h3>
                    {board.description && (
                      <p className="text-body-sm text-black/70 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                    <div className="mt-4 text-bahamian-turquoise font-bold text-body-sm">
                      View Board →
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          // Fallback: Show boards directly if no islands configured
          <>
            <div className="text-center mb-12">
              <h2 className="text-display-sm md:text-display-md text-black font-display mb-4">
                Choose Your Neighborhood
              </h2>
              <p className="text-body-lg text-black/70 max-w-2xl mx-auto">
                Explore local businesses and services. Tap a neighborhood to see what&apos;s happening.
              </p>
            </div>

            {boards.length === 0 ? (
              <div className="text-center py-12">
                <div className="card p-8 max-w-md mx-auto">
                  <h3 className="text-headline-lg text-black font-display mb-2">
                    Coming Soon!
                  </h3>
                  <p className="text-body-lg text-black/70">
                    We&apos;re setting up neighborhood boards. Check back soon!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.slug}`}
                    className="card p-8 hover:shadow-bold-lg transition-shadow duration-200"
                  >
                    <h3 className="text-headline-lg md:text-headline-xl text-bahamian-turquoise font-display mb-3">
                      {board.display_name}
                    </h3>
                    {board.description && (
                      <p className="text-body-md text-black/70">
                        {board.description}
                      </p>
                    )}
                    <div className="mt-6 text-bahamian-turquoise font-bold text-body-md">
                      View Board →
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-body-lg text-black/70 mb-6">
            Have a business? Claim your spot on the board.
          </p>
          <Link href="/claim" className="btn-primary inline-block">
            Claim Your Pin
          </Link>
        </div>
      </main>
    </div>
  )
}
