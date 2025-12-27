'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import BoardGrid from '@/components/BoardGrid'

interface Island {
  id: string
  name: string
  slug: string
  display_name: string
}

interface Board {
  id: string
  slug: string
  display_name: string
  description: string | null
  grid_cols: number
  island_id: string | null
}

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const neighborhood = params.neighborhood as string
  const [board, setBoard] = useState<Board | null>(null)
  const [island, setIsland] = useState<Island | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBoard() {
      try {
        const supabase = createBrowserClient()
        
        // Fetch board
        const { data: boardData, error: boardError } = await supabase
          .from('boards')
          .select('id, slug, display_name, description, grid_cols, island_id')
          .eq('slug', neighborhood)
          .single()

        if (boardError) throw boardError
        setBoard(boardData)

        // Fetch island if board has one
        if (boardData?.island_id) {
          const { data: islandData } = await supabase
            .from('islands')
            .select('id, name, slug, display_name')
            .eq('id', boardData.island_id)
            .single()
          
          if (islandData) {
            setIsland(islandData)
          }
        }
      } catch (error) {
        console.error('Error fetching board:', error)
      } finally {
        setLoading(false)
      }
    }

    if (neighborhood) {
      fetchBoard()
    }
  }, [neighborhood])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-display-sm text-black font-display mb-4">
            Board Not Found
          </h1>
          <p className="text-body-md text-black/70 mb-8">
            This neighborhood board doesn&apos;t exist.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-headline-md hover:underline">
            ← Back
          </Link>
          <div className="text-center flex-1">
            {/* Breadcrumb */}
            {island && (
              <div className="text-white/80 text-body-sm mb-1">
                {island.display_name}
              </div>
            )}
            <h1 className="text-display-sm md:text-display-md text-white font-display">
              {board.display_name}
            </h1>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Board Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {board.description && (
          <p className="text-body-lg text-black/70 mb-8 text-center">
            {board.description}
          </p>
        )}
        <BoardGrid boardId={board.id} gridCols={board.grid_cols} />
      </main>
    </div>
  )
}
