"""
SOS Emergency endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.sos import SOSTriggerRequest, SOSResponse, PoliceStationResponse

router = APIRouter()


@router.post("/trigger", response_model=SOSResponse, status_code=status.HTTP_201_CREATED)
async def trigger_sos(
    request: SOSTriggerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Trigger SOS emergency
    - Find nearest police station
    - Send SMS to emergency contacts
    - Create incident record
    """
    # TODO: Implement SOS trigger logic
    pass


@router.post("/upload-video", status_code=status.HTTP_200_OK)
async def upload_sos_video(
    incident_id: str,
    video: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload SOS video recording"""
    # TODO: Implement video upload to S3
    pass


@router.get("/nearest-police", response_model=PoliceStationResponse)
async def get_nearest_police_station(
    lat: float,
    lng: float,
    db: AsyncSession = Depends(get_db)
):
    """Find nearest police station"""
    # TODO: Implement geospatial query for nearest police station
    pass
