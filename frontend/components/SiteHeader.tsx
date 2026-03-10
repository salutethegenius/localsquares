'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { signOut } from '@/lib/auth'
import LogoLockup from '@/components/logo/LogoLockup'

const MOBILE_BREAKPOINT = 768

const HEADER_BG = 'rgba(10,10,10,0.92)'
const BORDER = 'rgba(255,255,255,0.08)'
const ACCENT = '#EAB308'
const TEXT = '#ffffff'
const TEXT_MUTED = 'rgba(255,255,255,0.75)'

export default function SiteHeader() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: HEADER_BG,
        borderColor: BORDER,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <LogoLockup
          href="/"
          size={isMobile ? 'sm' : 'md'}
          showTagline={!isMobile}
          markFill={ACCENT}
          textFill={TEXT}
          accentColor={ACCENT}
        />

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/explore"
            className="font-semibold text-sm transition-colors hover:text-[#EAB308]"
            style={{ color: TEXT_MUTED }}
          >
            Explore
          </Link>
          <Link
            href="/claim"
            className="font-semibold text-sm transition-colors hover:text-[#EAB308]"
            style={{ color: TEXT_MUTED }}
          >
            Get Started
          </Link>
          <Link
            href="/me"
            className="font-semibold text-sm transition-colors hover:text-[#EAB308]"
            style={{ color: TEXT_MUTED }}
          >
            Dashboard
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 rounded-full animate-pulse bg-white/20" />
          ) : user ? (
            <>
              <Link
                href="/me"
                className="inline-flex items-center gap-2 font-semibold text-sm transition-colors hover:text-[#EAB308]"
                style={{ color: TEXT }}
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
                className="text-sm font-medium transition-colors disabled:opacity-50 hover:text-white"
                style={{ color: TEXT_MUTED }}
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link
              href="/me"
              className="inline-flex items-center gap-2 font-bold px-5 py-2 rounded-full text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: ACCENT,
                color: '#0a0a0a',
                boxShadow: '0 4px 20px rgba(234,179,8,0.5)',
              }}
            >
              Log In
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1"
          style={{ color: TEXT }}
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

      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-3"
          style={{ borderColor: BORDER, background: HEADER_BG }}
        >
          <Link href="/explore" onClick={() => setMobileOpen(false)} className="block font-semibold py-2 transition-colors hover:text-[#EAB308]" style={{ color: TEXT }}>
            Explore
          </Link>
          <Link href="/claim" onClick={() => setMobileOpen(false)} className="block font-semibold py-2 transition-colors hover:text-[#EAB308]" style={{ color: TEXT }}>
            Get Started
          </Link>
          <Link href="/me" onClick={() => setMobileOpen(false)} className="block font-semibold py-2 transition-colors hover:text-[#EAB308]" style={{ color: TEXT }}>
            Dashboard
          </Link>
          <div className="border-t pt-3" style={{ borderColor: BORDER }}>
            {loading ? (
              <div className="w-20 h-8 rounded-full animate-pulse bg-white/20" />
            ) : user ? (
              <>
                <Link
                  href="/me"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 font-semibold py-2"
                  style={{ color: TEXT }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {user.business_name || user.full_name || 'My Account'}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut() }}
                  disabled={signingOut}
                  className="text-sm font-medium py-2 transition-colors hover:text-white disabled:opacity-50"
                  style={{ color: TEXT_MUTED }}
                >
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <Link
                href="/me"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 font-bold px-5 py-2 rounded-full text-sm"
                style={{ background: ACCENT, color: '#0a0a0a' }}
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
