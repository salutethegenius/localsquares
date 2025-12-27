from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_client
from app.models.pin import Pin, PinCreate, PinUpdate, PinWithSlot
from supabase import Client


class PinService:
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.table = "pins"
    
    def get_all(self, board_id: Optional[UUID] = None, status: Optional[str] = None) -> List[Pin]:
        """Get all pins, optionally filtered by board and status."""
        query = self.supabase.table(self.table).select("*")
        
        if board_id:
            query = query.eq("board_id", str(board_id))
        
        if status:
            query = query.eq("status", status)
        else:
            query = query.eq("status", "active")
        
        query = query.order("created_at", desc=True)
        response = query.execute()
        return [Pin(**row) for row in response.data]
    
    def get_by_id(self, pin_id: UUID) -> Optional[Pin]:
        """Get pin by ID."""
        response = self.supabase.table(self.table).select("*").eq("id", str(pin_id)).execute()
        if response.data:
            return Pin(**response.data[0])
        return None
    
    def get_for_board_grid(self, board_id: UUID) -> List[PinWithSlot]:
        """Get pins for a board with their slot positions."""
        # Get pins and join with pin_slots
        pins_response = self.supabase.table(self.table).select(
            "*, pin_slots(row_position, col_position)"
        ).eq("board_id", str(board_id)).eq("status", "active").execute()
        
        pins = []
        for row in pins_response.data:
            pin_data = {k: v for k, v in row.items() if k != "pin_slots"}
            pin = Pin(**pin_data)
            
            # Extract slot position if available
            slot_row = None
            slot_col = None
            if row.get("pin_slots") and len(row["pin_slots"]) > 0:
                slot = row["pin_slots"][0]
                slot_row = slot.get("row_position")
                slot_col = slot.get("col_position")
            
            pin_with_slot = PinWithSlot(**pin.model_dump(), slot_row=slot_row, slot_col=slot_col)
            pins.append(pin_with_slot)
        
        return pins
    
    def create(self, pin: PinCreate, user_id: UUID) -> Pin:
        """Create a new pin."""
        data = pin.model_dump()
        data["user_id"] = str(user_id)
        data["metadata"] = pin.metadata.model_dump() if pin.metadata else {}
        
        response = self.supabase.table(self.table).insert(data).execute()
        return Pin(**response.data[0])
    
    def update(self, pin_id: UUID, pin_update: PinUpdate, user_id: Optional[UUID] = None) -> Optional[Pin]:
        """Update a pin. If user_id is provided, verifies ownership."""
        # Verify ownership if user_id provided
        if user_id:
            existing = self.get_by_id(pin_id)
            if not existing or existing.user_id != user_id:
                return None
        
        data = pin_update.model_dump(exclude_unset=True)
        if "metadata" in data and data["metadata"]:
            # Handle metadata update
            if isinstance(data["metadata"], dict):
                pass  # Already a dict
            else:
                # If it's a PinMetadata model, convert to dict
                data["metadata"] = data["metadata"].model_dump()
        
        if not data:
            return self.get_by_id(pin_id)
        
        response = self.supabase.table(self.table).update(data).eq("id", str(pin_id)).execute()
        if response.data:
            return Pin(**response.data[0])
        return None
    
    def delete(self, pin_id: UUID, user_id: Optional[UUID] = None) -> bool:
        """Delete a pin. If user_id is provided, verifies ownership."""
        if user_id:
            existing = self.get_by_id(pin_id)
            if not existing or existing.user_id != user_id:
                return False
        
        response = self.supabase.table(self.table).delete().eq("id", str(pin_id)).execute()
        return len(response.data) > 0

