from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.core.rate_limit import limiter

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/embed")
@limiter.limit("10/minute")
async def embed(request: Request):
    return JSONResponse(
        status_code=501,
        content={"detail": "Embedding endpoint not yet implemented"},
    )


@router.post("/query")
@limiter.limit("10/minute")
async def query(request: Request):
    return JSONResponse(
        status_code=501,
        content={"detail": "AI query endpoint not yet implemented"},
    )
