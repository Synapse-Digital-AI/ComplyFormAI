from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.schemas.subcontractor_outreach import (
    SubcontractorOutreach,
    SubcontractorOutreachCreate,
    SubcontractorOutreachUpdate,
    SubcontractorOutreachDetail
)
from app.services import SubcontractorOutreachService

router = APIRouter(prefix="/outreach", tags=["subcontractor-outreach"])

@router.post("/", response_model=SubcontractorOutreach, status_code=status.HTTP_201_CREATED)
def create_outreach(
    outreach: SubcontractorOutreachCreate,
    db: Session = Depends(get_db)
):
    """Record a new subcontractor outreach"""
    service = SubcontractorOutreachService(db)
    return service.create_outreach(outreach)

@router.get("/{outreach_id}", response_model=SubcontractorOutreachDetail)
def get_outreach(
    outreach_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific outreach record"""
    service = SubcontractorOutreachService(db)
    outreach = service.get_outreach(outreach_id)
    
    if not outreach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach record {outreach_id} not found"
        )
    
    return outreach

@router.get("/opportunity/{opportunity_id}", response_model=List[SubcontractorOutreachDetail])
def get_outreach_by_opportunity(
    opportunity_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all outreach records for an opportunity"""
    service = SubcontractorOutreachService(db)
    return service.get_outreach_by_opportunity(opportunity_id)

@router.get("/organization/{organization_id}", response_model=List[SubcontractorOutreachDetail])
def get_outreach_by_organization(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all outreach records for an organization"""
    service = SubcontractorOutreachService(db)
    return service.get_outreach_by_organization(organization_id)

@router.get("/subcontractor/{subcontractor_id}", response_model=List[SubcontractorOutreachDetail])
def get_outreach_by_subcontractor(
    subcontractor_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all outreach records for a subcontractor"""
    service = SubcontractorOutreachService(db)
    return service.get_outreach_by_subcontractor(subcontractor_id)

@router.put("/{outreach_id}", response_model=SubcontractorOutreach)
def update_outreach(
    outreach_id: UUID,
    update_data: SubcontractorOutreachUpdate,
    db: Session = Depends(get_db)
):
    """Update an outreach record (e.g., change status, add notes)"""
    service = SubcontractorOutreachService(db)
    outreach = service.update_outreach(outreach_id, update_data)
    
    if not outreach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach record {outreach_id} not found"
        )
    
    return outreach

@router.delete("/{outreach_id}")
def delete_outreach(
    outreach_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete an outreach record"""
    service = SubcontractorOutreachService(db)
    success = service.delete_outreach(outreach_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach record {outreach_id} not found"
        )
    
    return {"message": "Outreach record deleted successfully"}

@router.get("/statistics/opportunity/{opportunity_id}")
def get_opportunity_outreach_stats(
    opportunity_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get outreach statistics for a specific opportunity
    
    Returns:
    - Total outreach attempts
    - Count by status (CONTACTED, RESPONDED, COMMITTED, DECLINED)
    - Response rate
    - Commitment rate
    """
    service = SubcontractorOutreachService(db)
    return service.get_outreach_statistics(opportunity_id=opportunity_id)

@router.get("/statistics/organization/{organization_id}")
def get_organization_outreach_stats(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get outreach statistics for an organization across all opportunities

    Returns:
    - Total outreach attempts
    - Count by status (CONTACTED, RESPONDED, COMMITTED, DECLINED)
    - Response rate
    - Commitment rate
    """
    service = SubcontractorOutreachService(db)
    return service.get_outreach_statistics(organization_id=organization_id)

@router.post("/bulk-create", response_model=List[SubcontractorOutreach], status_code=status.HTTP_201_CREATED)
def bulk_create_outreach(
    organization_id: UUID,
    opportunity_id: UUID,
    subcontractor_ids: List[UUID],
    initial_status: str = 'CONTACTED',
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Bulk create outreach records for multiple subcontractors

    This is useful after running a pre-bid assessment that identifies
    potential subcontractors. You can track outreach to all of them at once.

    Example use case:
    1. Run pre-bid assessment for an opportunity
    2. Assessment returns list of 10 matching subcontractors
    3. Use this endpoint to create outreach records for all 10
    4. Track responses as they come in

    Args:
    - organization_id: Your organization ID
    - opportunity_id: The opportunity you're pursuing
    - subcontractor_ids: List of subcontractor IDs from directory
    - initial_status: Default is 'CONTACTED'
    - notes: Optional notes (e.g., "Following up from assessment")

    Returns:
    - List of created outreach records (skips duplicates)
    """
    service = SubcontractorOutreachService(db)
    return service.bulk_create_outreach_from_assessment(
        organization_id=organization_id,
        opportunity_id=opportunity_id,
        subcontractor_ids=subcontractor_ids,
        initial_status=initial_status,
        notes=notes
    )

@router.get("/pending/organization/{organization_id}", response_model=List[SubcontractorOutreachDetail])
def get_pending_outreach(
    organization_id: UUID,
    opportunity_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Get all pending outreach (status = CONTACTED) for follow-up

    This helps you track which subcontractors you've contacted
    but haven't heard back from yet.

    Use this to:
    - See who needs a follow-up call/email
    - Identify stale outreach attempts
    - Track your outreach pipeline

    Args:
    - organization_id: Your organization ID
    - opportunity_id: Optional filter by specific opportunity

    Returns:
    - List of outreach records with CONTACTED status, ordered by contact date
    """
    service = SubcontractorOutreachService(db)
    return service.get_pending_outreach(
        organization_id=organization_id,
        opportunity_id=opportunity_id
    )