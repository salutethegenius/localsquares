/**
 * Brand and region config for the app.
 * Freeport MVP: scope to Freeport/Grand Bahama only; Nassau remains in DB but is hidden.
 * Set NEXT_PUBLIC_REGION_SCOPE=freeport (default for this build) or leave unset/other for multi-region.
 */

const regionScope = process.env.NEXT_PUBLIC_REGION_SCOPE ?? 'freeport'

export const REGION_SCOPE = regionScope
export const IS_FREEPORT_MVP = regionScope === 'freeport'

/** Island slug used for filtering boards (Grand Bahama = Freeport area). */
export const CURRENT_ISLAND_SLUG = 'grand-bahama'

/** Allowed island slugs for this deployment (only these boards appear in explore/claim). */
export const ALLOWED_ISLAND_SLUGS: string[] = IS_FREEPORT_MVP ? [CURRENT_ISLAND_SLUG] : []

export const APP_NAME = IS_FREEPORT_MVP ? 'Freeport Squares' : 'LocalSquares'
export const APP_TAGLINE = IS_FREEPORT_MVP ? 'Freeport Neighborhood Billboards' : 'Your Neighborhood Billboards'
export const CITY_NAME = IS_FREEPORT_MVP ? 'Freeport' : 'The Bahamas'
export const REGION_NAME = IS_FREEPORT_MVP ? 'Freeport & Grand Bahama' : 'Nassau & The Bahamas'
