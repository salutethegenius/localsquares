"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import PinMark from "./PinMark";

const TAGLINE = "Discover · Connect · Grow";

type LogoLockupProps = {
  /** "sm" = compact for nav, "md" = default, "lg" = footer/hero */
  size?: "sm" | "md" | "lg";
  /** Fill for the pin mark */
  markFill?: string;
  /** Main wordmark color */
  textFill?: string;
  /** Accent color for "SQUARES" (or second word) */
  accentColor?: string;
  /** Show tagline below wordmark */
  showTagline?: boolean;
  /** If set, wrap in Link to home */
  href?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
  /** Use as inline (span) instead of flex row; for footer tight layout */
  inline?: boolean;
};

const sizes = {
  sm: { mark: 36, wordmark: "1.1rem", letterSpacing: 1.5, tagline: "0.6rem" },
  md: { mark: 48, wordmark: "1.5rem", letterSpacing: 2, tagline: "0.65rem" },
  lg: { mark: 52, wordmark: "1.7rem", letterSpacing: 2.5, tagline: "0.7rem" },
};

export default function LogoLockup({
  size = "md",
  markFill = "#EAB308",
  textFill = "#ffffff",
  accentColor = "#EAB308",
  showTagline = false,
  href,
  style = {},
  inline = false,
}: LogoLockupProps) {
  const s = sizes[size];
  const parts = APP_NAME.toUpperCase().split(" ");
  const firstWord = parts[0] ?? APP_NAME;
  const secondWord = parts.slice(1).join(" ") || "";

  const content = (
    <>
      <PinMark width={s.mark} height={s.mark} fill={markFill} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', cursive",
            fontSize: s.wordmark,
            letterSpacing: s.letterSpacing,
            lineHeight: 1,
            color: textFill,
          }}
        >
          {firstWord}
          {secondWord ? " " : ""}
          {secondWord ? <span style={{ color: accentColor }}>{secondWord}</span> : null}
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "var(--font-inter), 'Plus Jakarta Sans', sans-serif",
              fontSize: s.tagline,
              letterSpacing: 3,
              color: textFill,
              opacity: 0.6,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {TAGLINE}
          </span>
        )}
      </div>
    </>
  );

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    ...style,
  };

  if (href) {
    return (
      <Link href={href} style={containerStyle} aria-label={`${APP_NAME} home`}>
        {content}
      </Link>
    );
  }

  return <div style={containerStyle}>{content}</div>;
}
