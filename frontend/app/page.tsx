'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({})
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bahamian-turquoise via-bahamian-turquoise to-cyan-400">
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
          {/* Floating Pin Icons */}
          <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-bahamian-yellow/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-bahamian-yellow/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-bahamian-yellow rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Now live in The Bahamas</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-white mb-6 leading-tight">
            Your Neighborhood is
            <span className="block text-bahamian-yellow">Looking For You</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Pin your business. Get discovered. Watch the customers roll in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/claim" 
              className="group relative inline-flex items-center gap-3 bg-bahamian-yellow text-black font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Create Your Listing - Free</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a 
              href="#how-it-works" 
              className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium transition-colors"
            >
              <span>See how it works</span>
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section 
        id="value-props"
        ref={setRef('value-props')}
        className="py-24 px-6 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible['value-props'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-5xl font-display text-black mb-4">
              Why <span className="text-bahamian-turquoise">LocalSquares</span>?
            </h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto">
              The easiest way for Bahamian businesses to get found by local customers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Claim Your Spot',
                description: 'Your business, your neighborhood. One pin on the board means maximum visibility to locals searching your area.',
                delay: '0ms'
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: 'Get Seen First',
                description: 'Our rotation algorithm ensures every merchant gets fair spotlight time. No big players drowning you out.',
                delay: '150ms'
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Just $1 to Go Live',
                description: 'Free to join and create your listing. Only $1 to activate your pin. Then $14/mo to stay visible.',
                delay: '300ms'
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`group bg-white border-2 border-black rounded-2xl p-8 shadow-bold hover:shadow-bold-lg transition-all duration-500 ${
                  isVisible['value-props'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: item.delay }}
              >
                <div className="w-16 h-16 bg-bahamian-turquoise/10 rounded-2xl flex items-center justify-center text-bahamian-turquoise mb-6 group-hover:bg-bahamian-turquoise group-hover:text-white transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-display text-black mb-3">{item.title}</h3>
                <p className="text-black/70 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section 
        id="how-it-works"
        ref={setRef('how-it-works')}
        className="py-24 px-6 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-5xl font-display text-black mb-4">
              How It Works
            </h2>
            <p className="text-lg text-black/70">
              Three simple steps to get your business on the map.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Pick Your Island',
                description: 'Choose New Providence, Grand Bahama, or your island. We cover the whole archipelago.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                delay: '0ms'
              },
              {
                step: '2',
                title: 'Pin Your Business',
                description: 'Add your details, hours, photos, and what makes your business special. Make it pop!',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                delay: '200ms'
              },
              {
                step: '3',
                title: 'Get Discovered',
                description: 'Locals find you when searching their area. From Bay Street to Carmichael, from Lucaya to Eight Mile Rock.',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                delay: '400ms'
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`relative text-center transition-all duration-700 ${
                  isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: item.delay }}
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-bahamian-yellow text-black font-bold rounded-full flex items-center justify-center text-lg shadow-lg z-10">
                  {item.step}
                </div>
                
                {/* Card */}
                <div className="bg-white border-2 border-black rounded-2xl p-8 pt-12 shadow-bold h-full">
                  <div className="w-20 h-20 bg-bahamian-turquoise/10 rounded-full flex items-center justify-center text-bahamian-turquoise mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-display text-black mb-3">{item.title}</h3>
                  <p className="text-black/70">{item.description}</p>
                </div>

                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-bahamian-turquoise/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Community */}
      <section 
        id="community"
        ref={setRef('community')}
        className="py-24 px-6 bg-bahamian-turquoise relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-700 ${isVisible['community'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <span className="text-white font-medium">Locals supporting locals</span>
          </div>
          
          <blockquote className="text-2xl md:text-4xl font-display text-white mb-8 leading-relaxed">
            &ldquo;From Bay Street to Carmichael, from Lucaya to Eight Mile Rock &mdash; 
            <span className="text-bahamian-yellow"> we&apos;re bringing neighborhoods together.</span>&rdquo;
          </blockquote>

          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5 text-bahamian-yellow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-white text-sm">Secure Payments via Stripe</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5 text-bahamian-yellow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-white text-sm">Made for Bahamians</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5 text-bahamian-yellow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-white text-sm">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section 
        id="pricing"
        ref={setRef('pricing')}
        className="py-24 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-5xl font-display text-black mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto">
              Free to join. Free to create your listing. Just $1 to go live.
            </p>
          </div>

          {/* How it works pricing flow */}
          <div className={`bg-gray-50 rounded-2xl p-8 mb-10 transition-all duration-700 delay-100 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bahamian-turquoise text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <div className="font-bold text-black">Sign Up</div>
                  <div className="text-bahamian-turquoise font-bold">FREE</div>
                </div>
              </div>
              <svg className="w-6 h-6 text-black/30 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bahamian-turquoise text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <div className="font-bold text-black">Create Listing</div>
                  <div className="text-bahamian-turquoise font-bold">FREE</div>
                </div>
              </div>
              <svg className="w-6 h-6 text-black/30 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bahamian-yellow text-black rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <div className="font-bold text-black">Go Live!</div>
                  <div className="text-bahamian-yellow font-bold">$1</div>
                </div>
              </div>
            </div>
            <p className="text-center text-black/60 mt-6 text-sm">
              Your pin stays in draft mode until you activate it. No pressure, no surprises.
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Free to Start */}
            <div className="border-2 border-bahamian-turquoise rounded-2xl p-8 bg-bahamian-turquoise/5">
              <div className="text-bahamian-turquoise font-bold text-sm uppercase tracking-wide mb-2">Start Here</div>
              <h3 className="text-2xl font-display text-black mb-2">Free to Join</h3>
              <div className="text-4xl font-display text-bahamian-turquoise mb-4">$0</div>
              <p className="text-black/70 mb-6">Create your account and build your listing. No card needed.</p>
              <ul className="space-y-3 text-black/70">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create your account
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Build your pin listing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save as draft anytime
                </li>
              </ul>
            </div>

            {/* Monthly */}
            <div className="border-2 border-black rounded-2xl p-8 shadow-bold relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-bahamian-yellow text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-black/50 font-bold text-sm uppercase tracking-wide mb-2">Monthly</div>
              <h3 className="text-2xl font-display text-black mb-2">Go Live</h3>
              <div className="text-4xl font-display text-black mb-1">$14<span className="text-lg text-black/50">/mo</span></div>
              <div className="text-bahamian-turquoise font-bold text-sm mb-4">+ $1 one-time activation</div>
              <p className="text-black/70 mb-6">Your pin goes live on the board. Get discovered!</p>
              <ul className="space-y-3 text-black/70">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pin visible on board
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fair rotation spotlight
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View analytics
                </li>
              </ul>
            </div>

            {/* Annual */}
            <div className="border-2 border-black/20 rounded-2xl p-8">
              <div className="text-black/50 font-bold text-sm uppercase tracking-wide mb-2">Annual</div>
              <h3 className="text-2xl font-display text-black mb-2">Best Value</h3>
              <div className="text-4xl font-display text-black mb-1">$140<span className="text-lg text-black/50">/yr</span></div>
              <div className="text-bahamian-turquoise font-bold text-sm mb-4">+ $1 one-time activation</div>
              <p className="text-black/70 mb-6">Save $28/year. Commit to growth.</p>
              <ul className="space-y-3 text-black/70">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in monthly
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  2 months free
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bahamian-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Featured spot access
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-black/50 mt-8">
            Want extra visibility? Book a featured spot for premium placement!
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        id="cta"
        ref={setRef('cta')}
        className="py-24 px-6 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-bahamian-turquoise/20 rounded-full blur-3xl" />
        
        <div className={`max-w-3xl mx-auto text-center relative z-10 transition-all duration-700 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-5xl font-display text-white mb-6">
            Ready to put your business
            <span className="block text-bahamian-turquoise">on the map?</span>
          </h2>
          
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Join Bahamian businesses already connecting with their neighborhoods on LocalSquares.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/claim" 
              className="group inline-flex items-center gap-3 bg-bahamian-yellow text-black font-bold px-10 py-5 rounded-full text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Create Your Free Listing</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/explore" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
            >
              <span>or explore neighborhoods</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} LocalSquares. Made with love in The Bahamas.
          </div>
          <div className="flex gap-6 text-white/50 text-sm">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/claim" className="hover:text-white transition-colors">Get Started</Link>
            <Link href="/me" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
