// frontend/lib/landingTheme.ts
// Single source of truth for the landing page visual system.
// Switch themes via NEXT_PUBLIC_LANDING_THEME=dark|bahamian (default: dark)

export type LandingTheme = {
  name: string;
  colors: {
    primary: string;       // Main accent — buttons, highlights, CTA
    primaryHover: string;  // Hover/active state of primary
    primaryGlow: string;   // Box-shadow glow (rgba with opacity)
    secondary: string;     // Supporting accent — step numbers, checkmarks
    background: string;    // Page background
    surface: string;       // Card/panel background
    surfaceHover: string;  // Card hover state
    overlay: string;       // Hero video overlay (rgba)
    overlayLight: string;  // Lighter overlay for gradient fades
    border: string;        // Default border (rgba)
    borderAccent: string;  // Accent border (rgba, primary-tinted)
    text: string;          // Primary text
    textMuted: string;     // Secondary/body text
    textFaint: string;     // Tertiary/placeholder text
    navBg: string;         // Scrolled nav background (rgba)
    tickerBg: string;      // Ticker bar background
    tickerText: string;    // Ticker text
    quoteband: string;     // Quote section background
    ctaBg: string;         // CTA section background gradient start
    footerBg: string;      // Footer background
    footerBorder: string;  // Footer top border
    pricingHighlight: string;       // Pricing card highlight bg gradient
    pricingHighlightBorder: string; // Pricing card highlight border
  };
  fonts: {
    heading: string;       // Display / hero / section headings
    body: string;          // Body copy, labels, CTAs
    googleFontsUrl: string;
  };
  easing: {
    spring: string;
    smooth: string;
    snappy: string;
  };
  heroGrid: string;         // CSS backgroundImage for hero grid overlay
  heroGridOpacity: number;
};

const easing = {
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  snappy: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
};

// ─── DARK THEME (default — black canvas, electric yellow) ──────────────────
const darkTheme: LandingTheme = {
  name: "dark",
  colors: {
    primary:               "#EAB308",
    primaryHover:          "#FACC15",
    primaryGlow:           "rgba(234,179,8,0.55)",
    secondary:             "#0BB5C3",
    background:            "#0a0a0a",
    surface:               "rgba(255,255,255,0.03)",
    surfaceHover:          "rgba(234,179,8,0.05)",
    overlay:               "rgba(10,10,10,0.88)",
    overlayLight:          "rgba(10,10,10,0.70)",
    border:                "rgba(255,255,255,0.08)",
    borderAccent:          "rgba(234,179,8,0.25)",
    text:                  "#ffffff",
    textMuted:             "rgba(255,255,255,0.50)",
    textFaint:             "rgba(255,255,255,0.25)",
    navBg:                 "rgba(10,10,10,0.92)",
    tickerBg:              "#EAB308",
    tickerText:            "#0a0a0a",
    quoteband:             "#0BB5C3",
    ctaBg:                 "#0d1a0d",
    footerBg:              "#050505",
    footerBorder:          "rgba(255,255,255,0.06)",
    pricingHighlight:      "linear-gradient(160deg, rgba(234,179,8,0.12), rgba(234,179,8,0.04))",
    pricingHighlightBorder:"#EAB308",
  },
  fonts: {
    heading: "'Bebas Neue', cursive",
    body:    "'Plus Jakarta Sans', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
  easing,
  heroGrid:
    "linear-gradient(rgba(234,179,8,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.04) 1px, transparent 1px)",
  heroGridOpacity: 1,
};

// ─── BAHAMIAN THEME (app-palette aligned — turquoise + yellow on dark) ──────
const bahamianTheme: LandingTheme = {
  name: "bahamian",
  colors: {
    primary:               "#00BDBD",
    primaryHover:          "#00D4D4",
    primaryGlow:           "rgba(0,189,189,0.5)",
    secondary:             "#FFD700",
    background:            "#0a1628",
    surface:               "rgba(255,255,255,0.04)",
    surfaceHover:          "rgba(0,189,189,0.06)",
    overlay:               "rgba(10,22,40,0.88)",
    overlayLight:          "rgba(10,22,40,0.70)",
    border:                "rgba(255,255,255,0.09)",
    borderAccent:          "rgba(0,189,189,0.28)",
    text:                  "#ffffff",
    textMuted:             "rgba(255,255,255,0.52)",
    textFaint:             "rgba(255,255,255,0.28)",
    navBg:                 "rgba(10,22,40,0.94)",
    tickerBg:              "#00BDBD",
    tickerText:            "#ffffff",
    quoteband:             "#005f6b",
    ctaBg:                 "#071828",
    footerBg:              "#060e1c",
    footerBorder:          "rgba(0,189,189,0.12)",
    pricingHighlight:      "linear-gradient(160deg, rgba(0,189,189,0.12), rgba(0,189,189,0.04))",
    pricingHighlightBorder:"#00BDBD",
  },
  fonts: {
    heading: "'Syne', sans-serif",
    body:    "'Plus Jakarta Sans', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
  easing,
  heroGrid:
    "linear-gradient(rgba(0,189,189,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,189,189,0.05) 1px, transparent 1px)",
  heroGridOpacity: 1,
};

const themes: Record<string, LandingTheme> = {
  dark:     darkTheme,
  bahamian: bahamianTheme,
};

export function getLandingTheme(): LandingTheme {
  const key = process.env.NEXT_PUBLIC_LANDING_THEME || "dark";
  return themes[key] ?? darkTheme;
}

export default getLandingTheme;
