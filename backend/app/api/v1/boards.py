from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from app.services.board_service import BoardService
from app.models.board import Board, BoardCreate, BoardUpdate
from app.core.auth import require_admin, CurrentUser

router = APIRouter(prefix="/boards", tags=["boards"])


def get_board_service() -> BoardService:
    return BoardService()


@router.get("", response_model=List[Board])
async def list_boards(service: BoardService = Depends(get_board_service)):
    """Get all boards."""
    return service.get_all()


@router.get("/{board_id}", response_model=Board)
async def get_board(
    board_id: UUID,
    service: BoardService = Depends(get_board_service)
):
    """Get board by ID."""
    board = service.get_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.get("/slug/{slug}", response_model=Board)
async def get_board_by_slug(
    slug: str,
    service: BoardService = Depends(get_board_service)
):
    """Get board by slug."""
    board = service.get_by_slug(slug)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.post("", response_model=Board, status_code=201)
async def create_board(
    board: BoardCreate,
    admin: CurrentUser = Depends(require_admin),
    service: BoardService = Depends(get_board_service)
):
    """Create a new board. Admin only."""
    return service.create(board)


@router.patch("/{board_id}", response_model=Board)
async def update_board(
    board_id: UUID,
    board_update: BoardUpdate,
    admin: CurrentUser = Depends(require_admin),
    service: BoardService = Depends(get_board_service)
):
    """Update a board. Admin only."""
    board = service.update(board_id, board_update)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.delete("/{board_id}", status_code=204)
async def delete_board(
    board_id: UUID,
    admin: CurrentUser = Depends(require_admin),
    service: BoardService = Depends(get_board_service)
):
    """Delete a board. Admin only."""
    success = service.delete(board_id)
    if not success:
        raise HTTPException(status_code=404, detail="Board not found")
