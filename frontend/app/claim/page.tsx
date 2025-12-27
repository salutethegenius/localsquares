'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import OnboardingFlow from '@/components/OnboardingFlow'

function OnboardingFlowWrapper() {
  return <OnboardingFlow />
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-bahamian-turquoise py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-headline-md hover:underline">
            ← Back
          </Link>
          <h1 className="text-display-sm text-white font-display text-center flex-1">
            Claim Your Pin
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Onboarding Flow */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-display-sm md:text-display-md text-black font-display mb-4">
            Get Your Business on the Board
          </h2>
          <p className="text-body-lg text-black/70">
            Join local businesses showcasing their services. Quick setup, bold visibility.
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bahamian-turquoise"></div>
          </div>
        }>
          <OnboardingFlowWrapper />
        </Suspense>
      </main>
    </div>
  )
}

