from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/embed")
async def embed():
    return JSONResponse(
        status_code=501,
        content={"detail": "Embedding endpoint not yet implemented"},
    )


@router.post("/query")
async def query():
    return JSONResponse(
        status_code=501,
        content={"detail": "AI query endpoint not yet implemented"},
    )
