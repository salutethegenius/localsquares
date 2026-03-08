'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { signOut } from '@/lib/auth'
import { APP_NAME } from '@/lib/brand'

export default function SiteHeader() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      window.location.href = '/'
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-bahamian-turquoise">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-white font-display text-xl md:text-2xl font-bold tracking-tight">
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-white/90 hover:text-white font-medium transition-colors">
            Explore
          </Link>
          <Link href="/claim" className="text-white/90 hover:text-white font-medium transition-colors">
            Get Started
          </Link>
          <Link href="/me" className="text-white/90 hover:text-white font-medium transition-colors">
            Dashboard
          </Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-white/20 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/me"
                className="inline-flex items-center gap-2 text-white font-medium hover:text-bahamian-yellow transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="max-w-[120px] truncate">
                  {user.business_name || user.full_name || 'My Account'}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link
              href="/claim"
              className="inline-flex items-center gap-2 bg-bahamian-yellow text-black font-bold px-5 py-2 rounded-full text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/20 bg-bahamian-turquoise px-4 py-4 space-y-3">
          <Link href="/explore" onClick={() => setMobileOpen(false)} className="block text-white font-medium py-2">
            Explore
          </Link>
          <Link href="/claim" onClick={() => setMobileOpen(false)} className="block text-white font-medium py-2">
            Get Started
          </Link>
          <Link href="/me" onClick={() => setMobileOpen(false)} className="block text-white font-medium py-2">
            Dashboard
          </Link>
          <div className="border-t border-white/20 pt-3">
            {loading ? (
              <div className="w-20 h-8 bg-white/20 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/me"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-white font-medium py-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {user.business_name || user.full_name || 'My Account'}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut() }}
                  disabled={signingOut}
                  className="text-white/70 hover:text-white text-sm font-medium py-2 disabled:opacity-50"
                >
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <Link
                href="/claim"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 bg-bahamian-yellow text-black font-bold px-5 py-2 rounded-full text-sm"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
