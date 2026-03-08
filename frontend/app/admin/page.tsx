'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { APP_NAME } from '@/lib/brand'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/claim')
      return
    }
    if (user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <h1 className="text-2xl font-display text-black">Access Denied</h1>
        <p className="text-black/60">You do not have permission to view this page.</p>
        <Link href="/" className="text-bahamian-turquoise hover:underline font-medium">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg hover:underline">
            &larr; Home
          </Link>
          <h1 className="text-xl md:text-2xl text-white font-display text-center flex-1">
            Admin Dashboard
          </h1>
          <Link href="/me" className="text-white font-bold text-lg hover:underline">
            My Account
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-display text-black mb-2">
            Welcome, {user.full_name || user.email || 'Admin'}
          </h2>
          <p className="text-black/60">
            {APP_NAME} administration panel. Manage boards, pins, and users from here.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-black rounded-2xl p-6 shadow-bold">
            <h3 className="text-xl font-display text-black mb-2">Boards</h3>
            <p className="text-black/60 mb-4">Manage neighborhood boards and pin slots.</p>
            <Link href="/explore" className="text-bahamian-turquoise hover:underline font-medium">
              View Boards &rarr;
            </Link>
          </div>
          <div className="border-2 border-black rounded-2xl p-6 shadow-bold">
            <h3 className="text-xl font-display text-black mb-2">Pins</h3>
            <p className="text-black/60 mb-4">Review and manage business pin listings.</p>
            <Link href="/explore" className="text-bahamian-turquoise hover:underline font-medium">
              View Pins &rarr;
            </Link>
          </div>
          <div className="border-2 border-black rounded-2xl p-6 shadow-bold">
            <h3 className="text-xl font-display text-black mb-2">Analytics</h3>
            <p className="text-black/60 mb-4">Track platform impressions, clicks, and growth.</p>
            <Link href="/me" className="text-bahamian-turquoise hover:underline font-medium">
              View Stats &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
