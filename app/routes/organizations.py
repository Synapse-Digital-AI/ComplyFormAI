from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import Organization, Subcontractor
from app.schemas.organization import Organization as OrgSchema, OrganizationCreate
from app.schemas.subcontractor import SubcontractorDetail

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.post("/", response_model=OrgSchema, status_code=status.HTTP_201_CREATED)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    org = Organization(**organization.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/", response_model=List[OrgSchema])
def list_organizations(db: Session = Depends(get_db)):
    """List all organizations"""
    return db.query(Organization).all()

@router.get("/{organization_id}", response_model=OrgSchema)
def get_organization(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific organization"""
    org = db.query(Organization).filter(Organization.id == organization_id).first()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization {organization_id} not found"
        )

    return org

@router.get("/{organization_id}/network", response_model=List[SubcontractorDetail])
def get_organization_network(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get an organization's network of subcontractors

    This endpoint returns all subcontractors that belong to the organization's network.
    This network is used for pre-bid assessments to calculate capacity and compliance gaps.

    Returns:
    - List of subcontractors with their certifications
    - Used by assessment service to determine if organization can meet compliance goals
    """
    # First verify the organization exists
    org = db.query(Organization).filter(Organization.id == organization_id).first()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization {organization_id} not found"
        )

    # Get all subcontractors in the organization's network with their certifications
    subcontractors = db.query(Subcontractor).options(
        joinedload(Subcontractor.certifications)
    ).filter(
        Subcontractor.organization_id == organization_id
    ).all()

    return subcontractors