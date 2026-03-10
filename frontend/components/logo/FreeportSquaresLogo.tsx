"use client";

import { useState } from "react";
import { PIN_MARK_PATH, PIN_VIEWBOX } from "@/lib/logoGeometry";

const u = 14;
const CX = 10 * u;
const CY = 8 * u;
const ARM = 4 * u;
const TAIL_TIP = 17 * u;
const BOTTOM = { x: CX, y: CY + ARM };
const INNER_R = 1.5 * u;
const TOP = { x: CX, y: CY - ARM };
const RIGHT = { x: CX + ARM, y: CY };
const LEFT = { x: CX - ARM, y: CY };

const constructionPinPath = PIN_MARK_PATH;
const W = PIN_VIEWBOX.w;
const H = PIN_VIEWBOX.h;

const GRID_COLOR = "rgba(255,255,255,0.08)";
const GUIDE_COLOR = "rgba(11,181,195,0.35)";
const ACCENT = "#EAB308";
const TEAL = "#0BB5C3";

export default function FreeportSquaresLogo() {
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [variant, setVariant] = useState("dark");
  const [showWordmark, setShowWordmark] = useState(true);

  const bg = variant === "dark" ? "#0a0a0a" : variant === "yellow" ? "#EAB308" : "#ffffff";
  const fill = variant === "dark" ? ACCENT : variant === "yellow" ? "#0a0a0a" : "#0a0a0a";
  const textFill = variant === "dark" ? "#ffffff" : variant === "yellow" ? "#0a0a0a" : "#0a0a0a";
  const textAccent = variant === "dark" ? ACCENT : variant === "yellow" ? "#0a0a0a" : ACCENT;

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        padding: "40px 24px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
      `,
        }}
      />

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: "0.7rem",
              color: TEAL,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Logo Construction
          </div>
          <h1
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "2.4rem",
              letterSpacing: 2,
              color: "white",
              lineHeight: 1,
            }}
          >
            Freeport Squares
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: 6 }}>
            Mark concept: location pin, square head — &quot;Squares&quot; built into the geometry
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
          {[
            { label: "Construction Grid", key: "grid", state: showGrid, toggle: () => setShowGrid((v) => !v) },
            { label: "Guide Lines", key: "guides", state: showGuides, toggle: () => setShowGuides((v) => !v) },
            { label: "Wordmark", key: "wm", state: showWordmark, toggle: () => setShowWordmark((v) => !v) },
          ].map(({ label, state, toggle }) => (
            <button
              key={label}
              onClick={toggle}
              style={{
                background: state ? ACCENT : "rgba(255,255,255,0.06)",
                color: state ? "#0a0a0a" : "rgba(255,255,255,0.5)",
                border: "none",
                padding: "7px 16px",
                borderRadius: 100,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: 0.5,
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          {["dark", "yellow", "white"].map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              style={{
                background: variant === v ? TEAL : "rgba(255,255,255,0.06)",
                color: variant === v ? "white" : "rgba(255,255,255,0.5)",
                border: "none",
                padding: "7px 16px",
                borderRadius: 100,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: 0.5,
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Main construction view + color swatches */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Construction SVG */}
          <div style={{ flex: "0 0 auto" }}>
            <div
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Construction View
            </div>
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                overflow: "hidden",
                display: "inline-block",
              }}
            >
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                {/* Grid */}
                {showGrid &&
                  Array.from({ length: 21 }, (_, i) => (
                    <g key={i}>
                      <line x1={i * u} y1={0} x2={i * u} y2={H} stroke={GRID_COLOR} strokeWidth={0.5} />
                      <line x1={0} y1={i * u} x2={W} y2={i * u} stroke={GRID_COLOR} strokeWidth={0.5} />
                    </g>
                  ))}

                {/* Center cross guide */}
                {showGuides && (
                  <>
                    <line x1={CX} y1={0} x2={CX} y2={H} stroke={GUIDE_COLOR} strokeWidth={0.5} strokeDasharray="3,3" />
                    <line x1={0} y1={CY} x2={W} y2={CY} stroke={GUIDE_COLOR} strokeWidth={0.5} strokeDasharray="3,3" />

                    {/* Bounding box of diamond (the source square) */}
                    <rect
                      x={CX - ARM}
                      y={CY - ARM}
                      width={ARM * 2}
                      height={ARM * 2}
                      fill="none"
                      stroke={`${TEAL}50`}
                      strokeWidth={0.5}
                      strokeDasharray="4,2"
                    />

                    {/* Arm length annotations */}
                    <line x1={CX} y1={CY} x2={RIGHT.x} y2={RIGHT.y} stroke={`${TEAL}80`} strokeWidth={0.5} />
                    <text x={CX + ARM / 2} y={CY - 4} fill={TEAL} fontSize={6} textAnchor="middle" fontFamily="monospace">
                      4u
                    </text>

                    <line x1={CX} y1={CY} x2={TOP.x} y2={TOP.y} stroke={`${TEAL}80`} strokeWidth={0.5} />
                    <text x={CX + 5} y={CY - ARM / 2} fill={TEAL} fontSize={6} fontFamily="monospace">
                      4u
                    </text>

                    <line x1={CX + 6} y1={BOTTOM.y} x2={CX + 6} y2={TAIL_TIP} stroke={`${ACCENT}80`} strokeWidth={0.5} />
                    <text x={CX + 9} y={(BOTTOM.y + TAIL_TIP) / 2 + 2} fill={ACCENT} fontSize={6} fontFamily="monospace">
                      5u
                    </text>

                    <circle cx={CX} cy={CY} r={2} fill={TEAL} opacity={0.8} />
                    <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke={`${ACCENT}60`} strokeWidth={0.5} strokeDasharray="2,2" />
                    <text x={CX + INNER_R + 3} y={CY + 2} fill={ACCENT} fontSize={5.5} fontFamily="monospace">
                      r=1.5u
                    </text>

                    {[TOP, RIGHT, BOTTOM, LEFT].map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r={2} fill={TEAL} opacity={0.9} />
                    ))}
                    <circle cx={CX} cy={TAIL_TIP} r={2} fill={ACCENT} opacity={0.9} />
                  </>
                )}

                {/* The mark */}
                <path d={constructionPinPath} fill={ACCENT} fillRule="evenodd" opacity={showGuides ? 0.9 : 1} />
              </svg>
            </div>
          </div>

          {/* Right: clean mark + variants */}
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Icon-only lockups */}
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Mark Only — All Sizes
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                {[1, 0.7, 0.45, 0.28].map((scale, si) => {
                  const sz = W * scale;
                  return (
                    <div
                      key={si}
                      style={{
                        background: bg,
                        borderRadius: 8 * scale,
                        padding: 6 * scale,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: variant === "white" ? "1px solid rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      <svg width={sz} height={sz} viewBox={`0 0 ${W} ${H}`}>
                        <path d={constructionPinPath} fill={fill} fillRule="evenodd" />
                      </svg>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                {["Full", "2/3", "40%", "25%"].map((s) => (
                  <div key={s} style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal lockup */}
            {showWordmark && (
              <div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Horizontal Lockup
                </div>
                <div
                  style={{
                    background: bg,
                    borderRadius: 14,
                    padding: "18px 24px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 14,
                    border: variant === "white" ? "1px solid rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <svg width={W * 0.38} height={H * 0.38} viewBox={`0 0 ${W} ${H}`}>
                    <path d={constructionPinPath} fill={fill} fillRule="evenodd" />
                  </svg>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', cursive",
                        fontSize: "1.55rem",
                        letterSpacing: 2.5,
                        lineHeight: 1,
                        color: textFill,
                      }}
                    >
                      FREEPORT <span style={{ color: textAccent }}>SQUARES</span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "0.6rem",
                        letterSpacing: 3,
                        color: variant === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      Discover · Connect · Grow
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Square app icon */}
            {showWordmark && (
              <div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  App Icon / Favicon
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  {[64, 48, 32, 20].map((sz) => (
                    <div
                      key={sz}
                      style={{
                        width: sz,
                        height: sz,
                        borderRadius: sz * 0.22,
                        background: variant === "dark" || variant === "white" ? ACCENT : "#0a0a0a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 16px rgba(234,179,8,0.4)",
                      }}
                    >
                      <svg width={sz * 0.62} height={sz * 0.62} viewBox={`0 0 ${W} ${H}`}>
                        <path
                          d={constructionPinPath}
                          fill={variant === "dark" || variant === "white" ? "#0a0a0a" : ACCENT}
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                  {["64px", "48px", "32px", "20px"].map((s) => (
                    <div key={s} style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Geometry spec */}
        <div
          style={{
            marginTop: 40,
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "20px 24px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: TEAL,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            Geometry Spec — Base Unit = 1u
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "Diamond arm", value: "4u from center" },
              { label: "Diamond span", value: "8u × 8u" },
              { label: "Pin tail length", value: "5u below diamond" },
              { label: "Tail base width", value: "2.4u at shoulder" },
              { label: "Inner cutout", value: "r = 1.5u" },
              { label: "Source square", value: "side = 4√2u ≈ 5.66u" },
              { label: "Canvas", value: "20u × 20u" },
              { label: "Center", value: "(10u, 8u)" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: 2, fontFamily: "monospace" }}>
                  {label}
                </div>
                <div style={{ fontSize: "0.85rem", color: "white", fontWeight: 600, fontFamily: "monospace" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rationale */}
        <div
          style={{
            marginTop: 24,
            padding: "20px 24px",
            border: `1px solid ${ACCENT}22`,
            borderRadius: 14,
            background: `${ACCENT}08`,
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: ACCENT,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            Design Rationale
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Square head", "The diamond is a square rotated 45° — \"Squares\" is literally the geometry of the mark"],
              ["Pin silhouette", "Reads as a map pin at any size — instant product recognition"],
              ["Inner cutout", "Standard pin anatomy but with square outer form — familiar yet distinctive"],
              ["Even-odd fill", "One compound path, one fill — renders clean at 16px favicon"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }}>→</span>
                <div>
                  <span style={{ color: "white", fontWeight: 700, fontSize: "0.82rem" }}>{title}: </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
