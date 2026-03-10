"use client";

import { PIN_MARK_PATH, PIN_VIEWBOX_STR } from "@/lib/logoGeometry";

type PinMarkProps = {
  width: number;
  height: number;
  fill?: string;
  className?: string;
};

export default function PinMark({ width, height, fill = "#EAB308", className }: PinMarkProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={PIN_VIEWBOX_STR}
      fill="none"
      className={className}
      aria-hidden
    >
      <path d={PIN_MARK_PATH} fill={fill} fillRule="evenodd" />
    </svg>
  );
}
