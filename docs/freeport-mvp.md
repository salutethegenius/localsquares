# Freeport Squares MVP

This deployment is a **Freeport-scoped MVP** of the LocalSquares product, built for pitching to the Freeport business association. The same codebase and database support both the full multi-island product (Nassau + Grand Bahama) and this Freeport-only build.

## What’s different in this build

- **Branding**: User-facing name is **Freeport Squares**; tagline and copy focus on Freeport and Grand Bahama.
- **Content**: Only boards (and pins) for **Grand Bahama / Freeport** are visible. Nassau and other islands are hidden from explore, board pages, claim flow, dashboard, and API responses.
- **Data**: Nassau boards and pins remain in the database and in the code paths; they are filtered out by configuration, not removed.

## How region scoping works

### Frontend

- **Config**: [`frontend/lib/brand.ts`](../frontend/lib/brand.ts) reads `NEXT_PUBLIC_REGION_SCOPE` (default `freeport`). When it is `freeport`, `ALLOWED_ISLAND_SLUGS` is `['grand-bahama']` and `APP_NAME` is "Freeport Squares".
- **Explore / boards / claim**: Islands and boards are filtered to `ALLOWED_ISLAND_SLUGS`. Board and pin detail pages return 404 when the board’s island is not in that list.
- **Dashboard**: Only pins on Freeport boards are shown.
- **Copy**: Landing page, footer, and key CTAs use Freeport-specific language and landmarks.

### Backend

- **Config**: [`backend/app/core/config.py`](../backend/app/core/config.py) has `region_scope` (e.g. `freeport`) and `current_island_slug` (e.g. `grand-bahama`). When `region_scope == "freeport"`, `allowed_island_slugs` returns `[current_island_slug]`.
- **Boards API**: List endpoints return only boards in allowed islands; single-board endpoints return 404 for boards outside the region.
- **Pins API**: List and board-scoped endpoints only return pins on allowed boards; single-pin get returns 404 if the pin’s board is outside the region.
- **Featured / analytics**: Endpoints that take a `board_id` (or pin that implies a board) return 404 when that board is not in the current region.

## Switching back to multi-island (Nassau + Freeport)

1. **Frontend**: Set `NEXT_PUBLIC_REGION_SCOPE` to something other than `freeport` (or leave it unset and adjust defaults in `brand.ts` so that `ALLOWED_ISLAND_SLUGS` is empty = no filter).
2. **Backend**: Set `REGION_SCOPE` to empty or a value other than `freeport` so that `allowed_island_slugs` is empty and no region filter is applied.

No data migration or code deletion is required; only config changes.

## Relationship to the full product

- The **full LocalSquares** vision includes New Providence (Nassau) and Grand Bahama (Freeport), with island selection and multi-region copy.
- This **Freeport Squares** build is a subset: same architecture, same DB, but with region scope and branding set to Freeport-only for the MVP pitch.
- Nassau work is preserved in the repo and DB and can be re-enabled by toggling the region/scope configuration as above.
