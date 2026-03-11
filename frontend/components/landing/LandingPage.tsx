"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getLandingTheme, type LandingTheme } from "@/lib/landingTheme";
import { APP_NAME, CITY_NAME, HERO_VIDEO, CONTACT_EMAIL, COMPANY_URL } from "@/lib/brand";
import LogoLockup from "@/components/logo/LogoLockup";

// ── Animation helpers ────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView] as const;
}

function Reveal({
  children,
  delay = 0,
  y = 40,
  scale = 0.96,
  style = {},
  theme,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  scale?: number;
  style?: React.CSSProperties;
  theme: LandingTheme;
  className?: string;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px) scale(${scale})`,
        transition: `opacity 0.7s ${theme.easing.smooth} ${delay}ms, transform 0.75s ${theme.easing.spring} ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SplitHeadline({
  text,
  highlight,
  started,
  baseDelay = 200,
  style = {},
  theme,
}: {
  text: string;
  highlight: string;
  started: boolean;
  baseDelay?: number;
  style?: React.CSSProperties;
  theme: LandingTheme;
}) {
  const allWords  = (text + " " + highlight).trim().split(" ");
  const normalCount = text.trim().split(" ").length;
  return (
    <h1 style={{ ...style, lineHeight: 1.05 }}>
      {allWords.map((word, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", marginRight: "0.28em" }}
        >
          <span
            style={{
              display:    "inline-block",
              opacity:    started ? 1 : 0,
              transform:  started ? "translateY(0)" : "translateY(110%)",
              transition: `opacity 0.5s ${theme.easing.smooth} ${baseDelay + i * 80}ms,
                           transform 0.6s ${theme.easing.spring} ${baseDelay + i * 80}ms`,
              color: i >= normalCount ? theme.colors.primary : theme.colors.text,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </h1>
  );
}

// ── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ text, theme }: { text: string; theme: LandingTheme }) {
  return (
    <div
      style={{
        display:       "inline-block",
        background:    `${theme.colors.primary}18`,
        border:        `1px solid ${theme.colors.borderAccent}`,
        borderRadius:  100,
        padding:       "5px 16px",
        marginBottom:  14,
        fontFamily:    theme.fonts.body,
        fontWeight:    700,
        fontSize:      "0.84rem",
        color:         theme.colors.primary,
        letterSpacing: 2,
        textTransform: "uppercase" as const,
      }}
    >
      {text}
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────
const NAV_BREAKPOINT = 768;

function LandingNav({
  scrolled,
  theme,
}: {
  scrolled: boolean;
  theme: LandingTheme;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < NAV_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const navItems = [
    { label: "Explore", href: "/explore" },
    { label: "Get Started", href: "/claim" },
    { label: "Dashboard", href: "/me" },
  ] as const;

  const linkStyle = (label: string) => ({
    background: "none",
    border: "none",
    fontFamily: theme.fonts.body,
    fontWeight: 600,
    fontSize: "0.975rem",
    color: hovered === label ? theme.colors.primary : theme.colors.textMuted,
    textDecoration: "none" as const,
    transition: `color 0.2s ${theme.easing.smooth}`,
    letterSpacing: 0.3,
  });

  return (
    <>
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? (scrolled ? "10px 16px" : "14px 16px") : scrolled ? "10px 40px" : "18px 40px",
        background: scrolled ? theme.colors.navBg : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? `1px solid ${theme.colors.border}` : "none",
        transition: `all 0.4s ${theme.easing.smooth}`,
      }}
    >
      <LogoLockup
        href="/"
        size={isMobile ? "sm" : "md"}
        showTagline={!isMobile}
        markFill={theme.colors.primary}
        textFill={theme.colors.text}
        accentColor={theme.colors.primary}
        style={{
          transform: scrolled ? "scale(0.95)" : "scale(1)",
          transition: `transform 0.4s ${theme.easing.spring}`,
          flexShrink: 0,
        }}
      />

      {/* Desktop: nav links + Log In */}
      <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: 32 }}>
        {navItems.map(({ label, href }) => (
          <Link key={label} href={href} onMouseEnter={() => setHovered(label)} onMouseLeave={() => setHovered(null)} style={linkStyle(label)}>
            {label}
          </Link>
        ))}
        <Link
          href="/me"
          style={{
            background: theme.colors.primary,
            color: theme.colors.tickerText,
            border: "none",
            padding: "9px 22px",
            borderRadius: 100,
            fontFamily: theme.fonts.body,
            fontWeight: 800,
            fontSize: "0.975rem",
            cursor: "pointer",
            letterSpacing: 0.3,
            boxShadow: `0 4px 20px ${theme.colors.primaryGlow}`,
            transition: `transform 0.3s ${theme.easing.spring}, box-shadow 0.3s ease`,
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.07)";
            e.currentTarget.style.boxShadow = `0 8px 28px ${theme.colors.primaryGlow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = `0 4px 20px ${theme.colors.primaryGlow}`;
          }}
        >
          Log In
        </Link>
      </div>

      {/* Mobile: hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle menu"
        style={{
          display: isMobile ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          padding: 0,
          border: "none",
          background: "none",
          color: theme.colors.text,
          cursor: "pointer",
        }}
      >
        {mobileOpen ? (
          <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </nav>

    {/* Mobile menu dropdown */}
    {isMobile && mobileOpen && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 199,
          background: theme.colors.navBg,
          paddingTop: 72,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderTop: `1px solid ${theme.colors.border}`,
        }}
      >
        {navItems.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            onClick={() => setMobileOpen(false)}
            style={{
              ...linkStyle(label),
              padding: "14px 0",
              fontSize: "1.1rem",
              color: theme.colors.text,
            }}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/me"
          onClick={() => setMobileOpen(false)}
          style={{
            display: "inline-block",
            marginTop: 16,
            background: theme.colors.primary,
            color: theme.colors.tickerText,
            border: "none",
            padding: "14px 24px",
            borderRadius: 100,
            fontFamily: theme.fonts.body,
            fontWeight: 800,
            fontSize: "1rem",
            textAlign: "center",
            textDecoration: "none",
            boxShadow: `0 4px 20px ${theme.colors.primaryGlow}`,
          }}
        >
          Log In
        </Link>
      </div>
    )}
    </>
  );
}

// ── Why card ─────────────────────────────────────────────────────────────────
function WhyCard({
  icon, title, desc, delay, theme,
}: {
  icon: string; title: string; desc: string; delay: number; theme: LandingTheme;
}) {
  const [ref, inView] = useInView();
  const [hovered, setHovered]   = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 260px", minWidth: 240,
        padding:      "2rem 1.75rem",
        borderRadius: 20,
        border:       `2px solid ${hovered ? theme.colors.borderAccent : theme.colors.border}`,
        background:   hovered ? theme.colors.surfaceHover : theme.colors.surface,
        boxShadow:    hovered ? `0 16px 48px ${theme.colors.primary}26` : "none",
        transform:    inView
          ? (hovered ? "translateY(-10px)" : "translateY(0)")
          : "translateY(50px)",
        opacity:    inView ? 1 : 0,
        transition: `all 0.5s ${theme.easing.spring} ${delay}ms`,
        cursor:     "default",
      }}
    >
      <div
        style={{
          width: 50, height: 50, borderRadius: 14,
          background:  hovered ? theme.colors.primary : `${theme.colors.primary}1e`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 18,
          transform:  hovered ? "scale(1.1) rotate(-6deg)" : "scale(1) rotate(0deg)",
          transition: `all 0.4s ${theme.easing.spring}`,
          boxShadow:  hovered ? `0 6px 24px ${theme.colors.primaryGlow}` : "none",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily:    theme.fonts.heading,
          letterSpacing: 1.5,
          fontSize:      "1.25rem",
          color:         theme.colors.text,
          marginBottom:  10,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: theme.fonts.body,
          fontSize:   "1rem",
          color:      theme.colors.textMuted,
          lineHeight: 1.75,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ── Step item ────────────────────────────────────────────────────────────────
function StepItem({
  num, icon, title, desc, delay, theme,
}: {
  num: number; icon: string; title: string; desc: string; delay: number; theme: LandingTheme;
}) {
  const [ref, inView] = useInView();
  const [hovered, setHovered]   = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 240px", minWidth: 220, textAlign: "center",
        opacity:    inView ? 1 : 0,
        transform:  inView ? "none" : "translateY(50px) scale(0.9)",
        transition: `opacity 0.6s ${theme.easing.smooth} ${delay}ms, transform 0.65s ${theme.easing.spring} ${delay}ms`,
        cursor:     "default",
      }}
    >
      <div
        style={{
          width: 80, height: 80, borderRadius: "50%",
          margin: "0 auto 20px",
          background:  hovered ? theme.colors.primary : `${theme.colors.primary}1a`,
          border:      `3px solid ${hovered ? theme.colors.primary : theme.colors.borderAccent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          boxShadow:  hovered ? `0 0 40px ${theme.colors.primary}66` : "none",
          transform:  hovered ? "scale(1.1)" : "scale(1)",
          transition: `all 0.4s ${theme.easing.spring}`,
          position:   "relative",
        }}
      >
        <span
          style={{
            position: "absolute", top: -8, right: -4,
            width: 24, height: 24, borderRadius: "50%",
            background:  theme.colors.primary,
            color:       theme.colors.tickerText,
            fontFamily:  theme.fonts.heading,
            fontSize:    "0.85rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {num}
        </span>
        {icon}
      </div>
      <h3
        style={{
          fontFamily:    theme.fonts.heading,
          letterSpacing: 1.5,
          fontSize:      "1.2rem",
          color:         theme.colors.text,
          marginBottom:  8,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: theme.fonts.body,
          fontSize:   "1rem",
          color:      theme.colors.textMuted,
          lineHeight: 1.75,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  tier, price, sub, features, cta, highlight, delay, theme,
}: {
  tier: string; price: string; sub?: string; features: string[];
  cta: string; highlight: boolean; delay: number; theme: LandingTheme;
}) {
  const [ref, inView] = useInView();
  const [hovered, setHovered]   = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 240px", minWidth: 230,
        borderRadius: 24,
        border:       `2px solid ${highlight ? theme.colors.pricingHighlightBorder : theme.colors.border}`,
        background:   highlight ? theme.colors.pricingHighlight : theme.colors.surface,
        padding:      "2.2rem 1.75rem",
        position:     "relative",
        boxShadow:    highlight
          ? (hovered ? `0 20px 60px ${theme.colors.primary}59` : `0 8px 40px ${theme.colors.primary}33`)
          : (hovered ? `0 12px 40px ${theme.colors.border}` : "none"),
        transform: inView
          ? (highlight
            ? (hovered ? "translateY(-14px) scale(1.03)" : "translateY(-8px) scale(1.02)")
            : (hovered ? "translateY(-8px)"              : "translateY(0)"))
          : "translateY(60px) scale(0.9)",
        opacity:    inView ? 1 : 0,
        transition: `all 0.6s ${theme.easing.spring} ${delay}ms`,
        cursor:     "default",
      }}
    >
      {highlight && (
        <div
          style={{
            position:  "absolute", top: -14, left: "50%",
            transform: "translateX(-50%)",
            background:    theme.colors.primary,
            color:         theme.colors.tickerText,
            fontFamily:    theme.fonts.heading,
            fontSize:      "0.8rem",
            letterSpacing: 2,
            padding:       "5px 18px",
            borderRadius:  100,
            boxShadow:     `0 4px 16px ${theme.colors.primaryGlow}`,
            whiteSpace:    "nowrap",
          }}
        >
          MOST POPULAR
        </div>
      )}

      <div
        style={{
          fontFamily:    theme.fonts.body,
          fontWeight:    700,
          fontSize:      "0.84rem",
          color:         highlight ? theme.colors.primary : theme.colors.textMuted,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom:  12,
        }}
      >
        {tier}
      </div>

      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontFamily:    theme.fonts.heading,
            fontSize:      "3.5rem",
            color:         theme.colors.text,
            letterSpacing: 1,
            lineHeight:    1,
          }}
        >
          {price}
        </span>
        {sub && (
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize:   "0.9rem",
              color:      theme.colors.textMuted,
              marginLeft: 6,
            }}
          >
            {sub}
          </span>
        )}
      </div>

      <div
        style={{
          height:     1,
          background: highlight ? `${theme.colors.primary}40` : theme.colors.border,
          margin:     "20px 0",
        }}
      />

      {features.map((f, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}
        >
          <span style={{ color: highlight ? theme.colors.primary : theme.colors.secondary, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
          <span style={{ fontFamily: theme.fonts.body, fontSize: "0.975rem", color: theme.colors.textMuted, lineHeight: 1.5 }}>{f}</span>
        </div>
      ))}

      <button
        style={{
          width:         "100%",
          marginTop:     24,
          background:    highlight ? theme.colors.primary : "transparent",
          color:         highlight ? theme.colors.tickerText : theme.colors.text,
          border:        highlight ? "none" : `1.5px solid ${theme.colors.border}`,
          padding:       "13px 0",
          borderRadius:  100,
          fontFamily:    theme.fonts.body,
          fontWeight:    800,
          fontSize:      "1.025rem",
          cursor:        "pointer",
          letterSpacing: 0.3,
          boxShadow:     highlight ? `0 6px 24px ${theme.colors.primary}66` : "none",
          transition:    `all 0.3s ${theme.easing.spring}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)";
          if (highlight)
            e.currentTarget.style.boxShadow = `0 10px 32px ${theme.colors.primaryGlow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          if (highlight)
            e.currentTarget.style.boxShadow = `0 6px 24px ${theme.colors.primary}66`;
        }}
      >
        {cta}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const theme                       = getLandingTheme();
  const [scrolled, setScrolled]     = useState(false);
  const [heroStarted, setHeroStarted] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroStarted(true), 150);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const t = theme;

  return (
    <div style={{ background: t.colors.background, color: t.colors.text, overflowX: "hidden" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('${t.fonts.googleFontsUrl}');
        @keyframes floatY  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-12px)} }
        @keyframes floatY2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(4deg)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes dotPulse{ 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.8);opacity:0} }
        @keyframes scanline{ 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @media (max-width: 767px){
          .how-steps{
            flex-direction: column;
            align-items: center;
          }
          .how-steps-divider{
            display: none;
          }
          .pricing-steps{
            max-width: 100%;
            margin: 0 auto 40px;
            flex-wrap: nowrap;
            gap: 12px;
          }
          .pricing-steps .step-label{
            font-size: 0.8rem;
          }
          .pricing-steps .step-sub{
            font-size: 1rem;
          }
        }
      `,
        }}
      />

      <LandingNav scrolled={scrolled} theme={t} />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative", height: "100vh", minHeight: 680,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${t.colors.overlay} 0%, ${t.colors.overlayLight} 50%, ${t.colors.overlay} 100%)`, zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden", opacity: 0.03 }}>
          <div style={{ position: "absolute", width: "100%", height: 2, background: "rgba(255,255,255,0.8)", animation: "scanline 6s linear infinite" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", backgroundImage: t.heroGrid, backgroundSize: "80px 80px", opacity: t.heroGridOpacity }} />

        {/* Geo accents */}
        <div style={{ position: "absolute", top: "15%", right: "8%", zIndex: 3, animation: "floatY 7s ease-in-out infinite", opacity: 0.18 }}>
          <div style={{ width: 80, height: 80, border: `2px solid ${t.colors.primary}`, borderRadius: 16, transform: "rotate(15deg)" }} />
        </div>
        <div style={{ position: "absolute", bottom: "20%", left: "6%", zIndex: 3, animation: "floatY2 9s ease-in-out infinite 2s", opacity: 0.14 }}>
          <div style={{ width: 50, height: 50, border: `2px solid ${t.colors.secondary}`, borderRadius: "50%" }} />
        </div>
        <div style={{ position: "absolute", top: "30%", left: "12%", zIndex: 3, animation: "floatY 11s ease-in-out infinite 4s", opacity: 0.12 }}>
          <div style={{ width: 30, height: 30, background: t.colors.primary, borderRadius: 6, transform: "rotate(30deg)" }} />
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 820, padding: "0 24px" }}>
          {/* Live badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${t.colors.primary}1e`,
            border: `1px solid ${t.colors.borderAccent}`,
            borderRadius: 100, padding: "6px 16px", marginBottom: 28,
            opacity:    heroStarted ? 1 : 0,
            transform:  heroStarted ? "scale(1)" : "scale(0.7)",
            transition: `opacity 0.6s ${t.easing.smooth} 0.1s, transform 0.6s ${t.easing.spring} 0.1s`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.colors.primary, display: "inline-block", animation: "dotPulse 1.6s ease-in-out infinite" }} />
            <span style={{ fontFamily: t.fonts.body, fontWeight: 700, fontSize: "0.875rem", color: t.colors.primary, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Now Live in {CITY_NAME}
            </span>
          </div>

          <SplitHeadline
            text="People In Your Area Are Looking For"
            highlight="Businesses Like Yours"
            started={heroStarted}
            baseDelay={250}
            theme={t}
            style={{ fontFamily: t.fonts.heading, fontSize: "clamp(2.8rem, 7.5vw, 5.8rem)", letterSpacing: 2, marginBottom: 20 }}
          />

          <p style={{
            fontFamily:  t.fonts.body, fontSize: "clamp(1.075rem, 2.2vw, 1.225rem)",
            color:       t.colors.textMuted, lineHeight: 1.75,
            maxWidth: 540, margin: "0 auto 36px",
            opacity:    heroStarted ? 1 : 0,
            transform:  heroStarted ? "none" : "translateY(20px)",
            transition: `opacity 0.7s ${t.easing.smooth} 1.4s, transform 0.7s ${t.easing.spring} 1.4s`,
          }}>
            Pin your business. Get discovered. Watch the customers roll in.
          </p>

          <div style={{
            display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap",
            opacity:    heroStarted ? 1 : 0,
            transform:  heroStarted ? "none" : "translateY(20px)",
            transition: `opacity 0.7s ${t.easing.smooth} 1.6s, transform 0.7s ${t.easing.spring} 1.6s`,
          }}>
            <Link
              href="/claim"
              style={{
                background:    t.colors.primary, color: t.colors.tickerText,
                border:        "none", padding: "16px 36px", borderRadius: 100,
                fontFamily:    t.fonts.body, fontWeight: 800, fontSize: "0.95rem",
                letterSpacing: 0.3,
                boxShadow:     `0 8px 32px ${t.colors.primaryGlow}`,
                transition:    `transform 0.3s ${t.easing.spring}, box-shadow 0.3s ease`,
                display: "flex", alignItems: "center", gap: 8,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.07) translateY(-2px)"; e.currentTarget.style.boxShadow = `0 14px 44px ${t.colors.primaryGlow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 32px ${t.colors.primaryGlow}`; }}
            >
              Create Your Listing — Free →
            </Link>
            <Link
              href="/explore"
              style={{
                background: `${t.colors.text}0f`, color: t.colors.text,
                border: `1.5px solid ${t.colors.border}`, padding: "16px 32px", borderRadius: 100,
                fontFamily: t.fonts.body, fontWeight: 600, fontSize: "0.95rem",
                backdropFilter: "blur(12px)",
                transition: `all 0.3s ${t.easing.smooth}`,
                display: "flex", alignItems: "center", gap: 8,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${t.colors.text}1e`; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${t.colors.text}0f`; e.currentTarget.style.transform = "none"; }}
            >
              🔍 Explore Listings
            </Link>
          </div>

          {/* Scroll cue */}
          <button
            onClick={() => scrollTo("why")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer", margin: "40px auto 0",
              opacity:    heroStarted ? 0.55 : 0,
              transition: `opacity 0.7s ${t.easing.smooth} 2s`,
            }}
          >
            <span style={{ fontFamily: t.fonts.body, fontSize: "0.84rem", color: t.colors.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>See how it works</span>
            <div style={{ width: 1, height: 32, background: `linear-gradient(180deg, ${t.colors.textMuted}, transparent)`, animation: "floatY 2s ease-in-out infinite" }} />
          </button>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(transparent, ${t.colors.background})`, zIndex: 5 }} />
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: t.colors.tickerBg, padding: "11px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "ticker 22s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(2)].map((_, j) => (
            <span key={j} style={{ display: "flex", gap: 48, paddingRight: 48 }}>
              {["📍 Pin Your Business", "👁️ Get Seen First", "💰 Pay What You Use", `🌴 Made for ${CITY_NAME}`, "📱 Tap-First Design", "🔍 Local Discovery"].map((item) => (
                <span key={item} style={{ fontFamily: t.fonts.heading, letterSpacing: 2.5, fontSize: "1rem", color: t.colors.tickerText }}>{item}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── WHY ── */}
      <section id="why" style={{ padding: "100px 40px" }}>
        <Reveal theme={t} style={{ textAlign: "center", marginBottom: 60 }}>
          <Pill text="Why It Works" theme={t} />
          <h2 style={{ fontFamily: t.fonts.heading, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", letterSpacing: 2, marginBottom: 12 }}>
            <span style={{ color: t.colors.secondary }}>Why</span> <span style={{ color: t.colors.primary }}>{APP_NAME}</span>?
          </h2>
          <p style={{ fontFamily: t.fonts.body, color: t.colors.textMuted, fontSize: "1.125rem", maxWidth: 480, margin: "0 auto" }}>
            The easiest way for {CITY_NAME} businesses to get found by local customers.
          </p>
        </Reveal>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <WhyCard theme={t} delay={0}   icon="📌" title="Claim Your Spot"  desc={`Your business, your neighbourhood. One pin on the board means maximum visibility to locals searching your area.`} />
          <WhyCard theme={t} delay={110} icon="👁️" title="Get Seen First"   desc="Our rotation algorithm ensures every merchant gets fair spotlight time. No big players drowning you out." />
          <WhyCard theme={t} delay={220} icon="💵" title="Just $1 to Go Live" desc="Free to join and create your listing. Only $1 to activate your pin. Then $14/month to stay visible." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="get-started" style={{ padding: "80px 40px 100px", background: t.colors.surface, position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.colors.borderAccent}, transparent)` }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.colors.borderAccent}, transparent)` }} />

        <Reveal theme={t} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontFamily: t.fonts.heading, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", letterSpacing: 2, marginBottom: 12, color: t.colors.secondary }}>How It Works</h2>
          <p style={{ fontFamily: t.fonts.body, color: t.colors.textMuted, fontSize: "1.125rem" }}>Three simple steps to get your business on the map.</p>
        </Reveal>

        <div className="how-steps" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
          <StepItem theme={t} delay={0}   num={1} icon="🗺️" title="Pick Your Area"   desc={`Choose your ${CITY_NAME} neighbourhood — Downtown, Lucaya, Eight Mile Rock, West End, and more.`} />
          <div className="how-steps-divider" style={{ display: "flex", alignItems: "center", paddingTop: 28, opacity: 0.2 }}>
            <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${t.colors.primary}, transparent)` }} />
          </div>
          <StepItem theme={t} delay={150} num={2} icon="🏢" title="Pin Your Business" desc="Add your details, hours, photos, and what makes your business special. Make it pop." />
          <div className="how-steps-divider" style={{ display: "flex", alignItems: "center", paddingTop: 28, opacity: 0.2 }}>
            <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${t.colors.primary})` }} />
          </div>
          <StepItem theme={t} delay={300} num={3} icon="🔍" title="Get Discovered"   desc={`Locals find you when searching their area. From Downtown ${CITY_NAME} to Lucaya, Eight Mile Rock to West End.`} />
        </div>
      </section>

      {/* ── QUOTE BAND ── */}
      <section style={{ padding: "80px 40px", background: t.colors.quoteband, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, left: -60, width: 300, height: 300, background: "rgba(0,0,0,0.1)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -80, right: -40, width: 400, height: 400, background: "rgba(0,0,0,0.08)", borderRadius: "50%" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <Reveal theme={t}>
            <div style={{ display: "inline-block", background: "rgba(0,0,0,0.15)", borderRadius: 100, padding: "5px 16px", marginBottom: 28, fontFamily: t.fonts.body, fontWeight: 700, fontSize: "0.84rem", color: "rgba(255,255,255,0.9)", letterSpacing: 2, textTransform: "uppercase" }}>
              Locals Supporting Locals
            </div>
            <blockquote style={{ fontFamily: t.fonts.heading, fontSize: "clamp(1.6rem, 4vw, 2.8rem)", color: t.colors.text, letterSpacing: 1.5, lineHeight: 1.3, marginBottom: 36 }}>
              "From Downtown {CITY_NAME} to Lucaya, from Eight Mile Rock to West End —{" "}
              <span style={{ color: t.colors.primary }}>we're bringing {CITY_NAME} together.</span>"
            </blockquote>
          </Reveal>
          <Reveal theme={t} delay={200}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {["🔒 Secure Payments via Cash N Go", `🌴 Made for ${CITY_NAME}`, "✕ Cancel Anytime"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.15)", borderRadius: 100, padding: "8px 18px" }}>
                  <span style={{ fontFamily: t.fonts.body, fontWeight: 600, fontSize: "0.945rem", color: "rgba(255,255,255,0.9)" }}>{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 40px" }}>
        <Reveal theme={t} style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: t.fonts.heading, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", letterSpacing: 2, marginBottom: 12 }}>
            <span style={{ color: t.colors.secondary }}>Simple</span>, <span style={{ color: t.colors.primary }}>Honest</span> Pricing
          </h2>
          <p style={{ fontFamily: t.fonts.body, color: t.colors.textMuted, fontSize: "1.125rem" }}>
            Free to join. Free to create your listing. Just $1 to go live.
          </p>
        </Reveal>

        <Reveal
          theme={t}
          delay={100}
          className="pricing-steps"
          style={{ maxWidth: 600, margin: "0 auto 56px", display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}
        >
          {[{ n: 1, label: "Sign Up", sub: "FREE" }, { n: 2, label: "Create Listing", sub: "FREE" }, { n: 3, label: "Go Live!", sub: "$1" }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "0 20px" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: s.n === 3 ? t.colors.primary : `${t.colors.primary}22`, border: s.n === 3 ? "none" : `2px solid ${t.colors.primary}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontFamily: t.fonts.heading, fontSize: "1.5rem", color: s.n === 3 ? t.colors.tickerText : t.colors.primary }}>{s.n}</div>
                <div className="step-label" style={{ fontFamily: t.fonts.body, fontSize: "0.875rem", color: t.colors.textMuted, fontWeight: 600 }}>{s.label}</div>
                <div className="step-sub" style={{ fontFamily: t.fonts.heading, fontSize: "1.125rem", color: t.colors.primary, letterSpacing: 1 }}>{s.sub}</div>
              </div>
              {i < 2 && <div style={{ width: 40, height: 1, background: t.colors.border, flexShrink: 0 }} />}
            </div>
          ))}
        </Reveal>

        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end" }}>
          <PricingCard theme={t} delay={0}   tier="START HERE" price="$0"   features={["Create your account", "Build your pin listing", "Save as draft anytime"]} cta="Get Started Free" highlight={false} />
          <PricingCard theme={t} delay={120} tier="MONTHLY"    price="$14"  sub="/mo + $1 activation" features={["Pin visible on board", "Fair rotation spotlight", "View analytics", "Everything in free tier"]} cta="Go Live →" highlight={true} />
          <PricingCard theme={t} delay={240} tier="ANNUAL"     price="$140" sub="/yr + $1 activation" features={["Save $28/year", "2 months free", "Featured spot access", "Everything in monthly"]} cta="Best Value →" highlight={false} />
        </div>

        <Reveal theme={t} delay={400} style={{ textAlign: "center", marginTop: 28 }}>
          <p style={{ fontFamily: t.fonts.body, fontSize: "0.945rem", color: t.colors.textFaint }}>
            Want extra visibility? Book a featured spot for premium placement.
          </p>
        </Reveal>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 40px 120px", background: `linear-gradient(160deg, ${t.colors.ctaBg} 0%, ${t.colors.background} 60%)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: `radial-gradient(ellipse, ${t.colors.primary}14 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.colors.borderAccent}, transparent)` }} />

        <Reveal theme={t} style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <h2 style={{ fontFamily: t.fonts.heading, fontSize: "clamp(2.4rem, 6vw, 4.5rem)", letterSpacing: 2, lineHeight: 1.05, marginBottom: 20 }}>
            <span style={{ color: t.colors.text }}>Ready to put your business</span>
            <br />
            <span style={{ color: t.colors.primary }}>on the map?</span>
          </h2>
          <p style={{ fontFamily: t.fonts.body, color: t.colors.textMuted, fontSize: "1.125rem", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
            Join {CITY_NAME} businesses already connecting with their neighborhoods on {APP_NAME}.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/claim"
              style={{
                background: t.colors.primary, color: t.colors.tickerText,
                border: "none", padding: "17px 40px", borderRadius: 100,
                fontFamily: t.fonts.body, fontWeight: 800, fontSize: "1.125rem",
                boxShadow: `0 8px 32px ${t.colors.primaryGlow}`,
                transition: `transform 0.3s ${t.easing.spring}, box-shadow 0.3s ease`,
                animation: "pulseGlow 3s ease-in-out infinite",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.07)"; e.currentTarget.style.boxShadow = `0 16px 50px ${t.colors.primaryGlow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 32px ${t.colors.primaryGlow}`; }}
            >
              Create Your Free Listing →
            </Link>
            <Link
              href="/explore"
              style={{ background: "transparent", color: t.colors.textMuted, border: "none", padding: "17px 0", fontFamily: t.fonts.body, fontWeight: 600, fontSize: "1.025rem", letterSpacing: 0.3, transition: `color 0.2s ${t.easing.smooth}`, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.colors.textMuted)}
            >
              or explore neighbourhoods →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: t.colors.footerBg, padding: "50px 40px 24px", borderTop: `1px solid ${t.colors.footerBorder}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 40 }}>
            <div style={{ maxWidth: 320, minWidth: 0 }}>
              <LogoLockup
                href="/"
                size="md"
                showTagline
                markFill={t.colors.primary}
                textFill={t.colors.text}
                accentColor={t.colors.primary}
                style={{ marginBottom: 12 }}
              />
              <p style={{ fontFamily: t.fonts.body, fontSize: "0.925rem", color: t.colors.textFaint, lineHeight: 1.7 }}>
                Shop Local. Earn Rewards. Support {CITY_NAME}.
              </p>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontFamily: t.fonts.body, fontSize: "0.9rem", color: t.colors.textFaint, textDecoration: "none", display: "block", marginTop: 10 }}>
                {CONTACT_EMAIL}
              </a>
            </div>
            {[
              { title: "Platform", links: [{ label: "Explore", href: "/explore" }, { label: "Get Started", href: "/claim" }, { label: "Dashboard", href: "/me" }, { label: "Pricing", href: "#pricing" }] },
              { title: "Company",  links: [{ label: "About DFBA", href: COMPANY_URL }, { label: "Contact", href: `mailto:${CONTACT_EMAIL}` }, { label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontFamily: t.fonts.heading, letterSpacing: 2, fontSize: "0.925rem", color: t.colors.textFaint, marginBottom: 16, textTransform: "uppercase" }}>{title}</div>
                {links.map(({ label, href }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      style={{ fontFamily: t.fonts.body, color: t.colors.textFaint, fontSize: "0.945rem", textDecoration: "none", transition: `color 0.2s` }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = t.colors.primary}
                      onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = t.colors.textFaint}
                    >
                      {label}
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${t.colors.footerBorder}`, paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: t.fonts.body, fontSize: "0.875rem", color: t.colors.textFaint }}>© 2026 {APP_NAME}. Made with ❤️ in {CITY_NAME}.</span>
            <span style={{ fontFamily: t.fonts.body, fontSize: "0.875rem", color: t.colors.textFaint }}>Developed by KemisDigital · Operated by Downtown Freeport Business Association</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
