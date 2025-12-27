from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_client
from app.models.board import Board, BoardCreate, BoardUpdate
from supabase import Client


class BoardService:
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.table = "boards"
    
    def get_all(self) -> List[Board]:
        """Get all boards."""
        response = self.supabase.table(self.table).select("*").execute()
        return [Board(**row) for row in response.data]
    
    def get_by_id(self, board_id: UUID) -> Optional[Board]:
        """Get board by ID."""
        response = self.supabase.table(self.table).select("*").eq("id", str(board_id)).execute()
        if response.data:
            return Board(**response.data[0])
        return None
    
    def get_by_slug(self, slug: str) -> Optional[Board]:
        """Get board by slug."""
        response = self.supabase.table(self.table).select("*").eq("slug", slug).execute()
        if response.data:
            return Board(**response.data[0])
        return None
    
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

