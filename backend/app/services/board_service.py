from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_client
from app.core.config import settings
from app.models.board import Board, BoardCreate, BoardUpdate
from supabase import Client


class BoardService:
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.table = "boards"

    def _allowed_island_ids(self) -> List[str]:
        """When region_scope is set (e.g. freeport), return island IDs that are visible."""
        slugs = settings.allowed_island_slugs
        if not slugs:
            return []
        r = self.supabase.table("islands").select("id").in_("slug", slugs).execute()
        return [str(row["id"]) for row in (r.data or [])]

    def _board_in_region(self, row: dict) -> bool:
        """Return True if board is in the current region (or no region filter)."""
        allowed_ids = self._allowed_island_ids()
        if not allowed_ids:
            return True
        island_id = row.get("island_id")
        return island_id is not None and str(island_id) in allowed_ids

    def get_all(self) -> List[Board]:
        """Get all boards (filtered by region when region_scope is set)."""
        allowed_ids = self._allowed_island_ids()
        query = self.supabase.table(self.table).select("*")
        if allowed_ids:
            query = query.in_("island_id", allowed_ids)
        response = query.execute()
        return [Board(**row) for row in response.data]

    def get_by_id(self, board_id: UUID) -> Optional[Board]:
        """Get board by ID (returns None if board is outside current region)."""
        response = self.supabase.table(self.table).select("*").eq("id", str(board_id)).execute()
        if not response.data:
            return None
        row = response.data[0]
        if not self._board_in_region(row):
            return None
        return Board(**row)

    def get_by_slug(self, slug: str) -> Optional[Board]:
        """Get board by slug (returns None if board is outside current region)."""
        response = self.supabase.table(self.table).select("*").eq("slug", slug).execute()
        if not response.data:
            return None
        row = response.data[0]
        if not self._board_in_region(row):
            return None
        return Board(**row)

    def is_board_in_region(self, board_id: UUID) -> bool:
        """Return True if the board exists and is in the current region."""
        return self.get_by_id(board_id) is not None

    def create(self, board: BoardCreate) -> Board:
        """Create a new board."""
        data = board.model_dump()
        response = self.supabase.table(self.table).insert(data).execute()
        return Board(**response.data[0])
    
    def update(self, board_id: UUID, board_update: BoardUpdate) -> Optional[Board]:
        """Update a board."""
        data = board_update.model_dump(exclude_unset=True)
        if not data:
            return self.get_by_id(board_id)
        
        response = self.supabase.table(self.table).update(data).eq("id", str(board_id)).execute()
        if response.data:
            return Board(**response.data[0])
        return None
    
    def delete(self, board_id: UUID) -> bool:
        """Delete a board."""
        response = self.supabase.table(self.table).delete().eq("id", str(board_id)).execute()
        return len(response.data) > 0

