"""
Route calculation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.schemas.route import RouteRequest, RouteResponse

router = APIRouter()


@router.post("/calculate", response_model=List[RouteResponse])
async def calculate_routes(
    request: RouteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate multiple route options between source and destination
    Returns routes sorted by safety-distance composite score
    """
    # TODO: Implement route calculation with crime score weighting
    pass


@router.get("/safest", response_model=RouteResponse)
async def get_safest_route(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float,
    db: AsyncSession = Depends(get_db)
):
    """Get the safest route option"""
    # TODO: Implement safest route calculation
    pass
