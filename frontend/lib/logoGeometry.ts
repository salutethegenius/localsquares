/**
 * Single source of truth for the Freeport Squares pin mark (diamond + tail, even-odd inner cutout).
 * Used by LogoLockup, FreeportSquaresLogo, favicon, and app icon.
 */
const u = 14;
const CX = 10 * u;
const CY = 8 * u;
const ARM = 4 * u;
const TAIL_TIP = 17 * u;
const TAIL_WIDTH = 1.2 * u;
const INNER_R = 1.5 * u;

const TOP = { x: CX, y: CY - ARM };
const RIGHT = { x: CX + ARM, y: CY };
const BOTTOM = { x: CX, y: CY + ARM };
const LEFT = { x: CX - ARM, y: CY };

const diamondPath = `
  M ${TOP.x} ${TOP.y}
  L ${RIGHT.x} ${RIGHT.y}
  L ${BOTTOM.x} ${BOTTOM.y}
  L ${LEFT.x} ${LEFT.y}
  Z
`;

const fullPinPath = `
  ${diamondPath}
  M ${BOTTOM.x - TAIL_WIDTH} ${BOTTOM.y}
  L ${CX} ${TAIL_TIP}
  L ${BOTTOM.x + TAIL_WIDTH} ${BOTTOM.y}
  Z
`;

const innerCircle = `M ${CX + INNER_R} ${CY} A ${INNER_R} ${INNER_R} 0 1 0 ${CX - INNER_R} ${CY} A ${INNER_R} ${INNER_R} 0 1 0 ${CX + INNER_R} ${CY} Z`;

export const PIN_MARK_PATH = `${fullPinPath} ${innerCircle}`;
export const PIN_VIEWBOX = { w: 20 * u, h: 20 * u };
export const PIN_VIEWBOX_STR = `0 0 ${20 * u} ${20 * u}`;
