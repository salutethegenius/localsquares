#!/usr/bin/env python3
"""
Seed the database with initial Nassau neighborhood boards.

Run this script after setting up the database to populate initial boards.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_boards.py
"""

import os
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase_client


# Nassau neighborhood boards to seed
BOARDS = [
    {
        "neighborhood": "downtown-nassau",
        "slug": "downtown-nassau",
        "display_name": "Downtown Nassau",
        "description": "Bay Street, straw market, and the heart of Nassau",
        "grid_cols": 3,
    },
    {
        "neighborhood": "cable-beach",
        "slug": "cable-beach",
        "display_name": "Cable Beach",
        "description": "Cable Beach strip, resorts, and restaurants",
        "grid_cols": 3,
    },
    {
        "neighborhood": "paradise-island",
        "slug": "paradise-island",
        "display_name": "Paradise Island",
        "description": "Paradise Island businesses and attractions",
        "grid_cols": 3,
    },
    {
        "neighborhood": "eastern-nassau",
        "slug": "eastern-nassau",
        "display_name": "Eastern Nassau",
        "description": "Eastern Road, Fox Hill, and beyond",
        "grid_cols": 3,
    },
    {
        "neighborhood": "western-nassau",
        "slug": "western-nassau",
        "display_name": "Western Nassau",
        "description": "West Bay Street and surrounding areas",
        "grid_cols": 3,
    },
    {
        "neighborhood": "over-the-hill",
        "slug": "over-the-hill",
        "display_name": "Over the Hill",
        "description": "Bain Town, Grants Town, and historic Nassau",
        "grid_cols": 3,
    },
    {
        "neighborhood": "south-beach",
        "slug": "south-beach",
        "display_name": "South Beach",
        "description": "South Beach and surrounding neighborhoods",
        "grid_cols": 3,
    },
    {
        "neighborhood": "carmichael",
        "slug": "carmichael",
        "display_name": "Carmichael",
        "description": "Carmichael Road area businesses",
        "grid_cols": 3,
    },
]


def seed_boards():
    """Insert boards into the database if they don't already exist."""
    print("Connecting to Supabase...")
    supabase = get_supabase_client()
    
    print("Fetching existing boards...")
    existing_response = supabase.table("boards").select("slug").execute()
    existing_slugs = {board["slug"] for board in existing_response.data}
    
    boards_to_insert = []
    for board in BOARDS:
        if board["slug"] not in existing_slugs:
            boards_to_insert.append(board)
        else:
            print(f"  Skipping '{board['display_name']}' (already exists)")
    
    if not boards_to_insert:
        print("\nAll boards already exist. Nothing to seed.")
        return
    
    print(f"\nInserting {len(boards_to_insert)} new boards...")
    for board in boards_to_insert:
        try:
            supabase.table("boards").insert(board).execute()
            print(f"  ✓ Created '{board['display_name']}'")
        except Exception as e:
            print(f"  ✗ Failed to create '{board['display_name']}': {e}")
    
    print("\nBoard seeding complete!")


if __name__ == "__main__":
    seed_boards()

