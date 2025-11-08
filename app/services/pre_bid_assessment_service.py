from typing import List, Optional, Dict
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from app.models import (
    PreBidAssessment,
    Opportunity,
    Jurisdiction,
    SubcontractorDirectory,
    Subcontractor,
    Certification
)
from app.schemas.pre_bid_assessment import PreBidAssessmentCreate, AssessmentRequest
from app.services.subcontractor_directory_service import SubcontractorDirectoryService

class PreBidAssessmentService:
    """Service for pre-bid assessment operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.subcontractor_service = SubcontractorDirectoryService(db)
    
    def create_assessment(
        self, 
        assessment_data: PreBidAssessmentCreate
    ) -> PreBidAssessment:
        """Create a new pre-bid assessment"""
        assessment = PreBidAssessment(**assessment_data.model_dump())
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment
    
    def get_assessment(
        self, 
        assessment_id: UUID
    ) -> Optional[PreBidAssessment]:
        """Get an assessment by ID"""
        return self.db.query(PreBidAssessment).options(
            joinedload(PreBidAssessment.opportunity).joinedload(Opportunity.jurisdiction)
        ).filter(PreBidAssessment.id == assessment_id).first()
    
    def get_assessments_by_organization(
        self,
        organization_id: UUID
    ) -> List[PreBidAssessment]:
        """Get all assessments for an organization"""
        return self.db.query(PreBidAssessment).options(
            joinedload(PreBidAssessment.opportunity).joinedload(Opportunity.jurisdiction)
        ).filter(
            PreBidAssessment.organization_id == organization_id
        ).order_by(PreBidAssessment.assessed_at.desc()).all()

    def _get_organization_network(self, organization_id: UUID) -> List[Subcontractor]:
        """
        Get organization's own network of subcontractors
        These are the subcontractors that the organization has already worked with
        or added to their network for bidding purposes.
        """
        return self.db.query(Subcontractor).options(
            joinedload(Subcontractor.certifications)
        ).filter(
            Subcontractor.organization_id == organization_id
        ).all()

    def _calculate_network_capacity(
        self,
        network_subs: List[Subcontractor],
        cert_type: str,
        naics_codes: List[str] = None
    ) -> Dict:
        """
        Calculate the capacity of organization's network for a specific certification type

        Args:
            network_subs: List of subcontractors in the organization's network
            cert_type: Type of certification to check (e.g., 'MBE', 'VSBE')
            naics_codes: Optional NAICS codes to filter by capability

        Returns:
            Dict with count and list of matching subcontractors
        """
        matching_subs = []

        for sub in network_subs:
            # Check if subcontractor has the required certification type
            has_cert = False

            # Check certifications relationship
            for cert in sub.certifications:
                if cert.cert_type and cert_type.upper() in cert.cert_type.upper():
                    # If NAICS codes are specified, check if they match
                    if naics_codes and cert.naics_codes:
                        # cert.naics_codes is stored as JSONB, could be a list
                        cert_naics_list = cert.naics_codes if isinstance(cert.naics_codes, list) else []
                        if any(naics in cert_naics_list for naics in naics_codes):
                            has_cert = True
                            break
                    else:
                        has_cert = True
                        break

            # Fallback: check is_mbe flag for MBE certification
            if cert_type.upper() == 'MBE' and sub.is_mbe:
                has_cert = True

            if has_cert:
                matching_subs.append(sub)

        return {
            "count": len(matching_subs),
            "subcontractors": matching_subs
        }
    
    def perform_assessment(
        self, 
        request: AssessmentRequest
    ) -> Dict:
        """
        Perform a comprehensive pre-bid assessment
        Returns assessment data with risk score, gaps, and recommendations
        """
        # Get the opportunity
        opportunity = self.db.query(Opportunity).options(
            joinedload(Opportunity.jurisdiction)
        ).filter(Opportunity.id == request.opportunity_id).first()
        
        if not opportunity:
            raise ValueError("Opportunity not found")
        
        # Get jurisdiction
        jurisdiction = opportunity.jurisdiction

        if not jurisdiction:
            raise ValueError(f"Opportunity {request.opportunity_id} has no associated jurisdiction")

        # Initialize assessment data
        assessment_data = {
            "organization_id": request.organization_id,
            "opportunity_id": request.opportunity_id,
            "overall_risk_score": 0,
            "mbe_gap_percentage": Decimal('0.0'),
            "vsbe_gap_percentage": Decimal('0.0'),
            "available_subcontractors_count": 0,
            "recommendation": "BID",
            "recommendation_reason": "",
            "risk_factors": [],
            "matching_subcontractors": [],
            "organization_network_count": 0,
            "organization_network_mbe_count": 0,
            "organization_network_vsbe_count": 0
        }

        risk_score = 0
        risk_factors = []

        # 1. Get organization's own network first
        org_network = self._get_organization_network(request.organization_id)
        assessment_data["organization_network_count"] = len(org_network)

        # Calculate organization's network capacity for MBE and VSBE
        org_network_mbe = self._calculate_network_capacity(
            org_network,
            cert_type='MBE',
            naics_codes=opportunity.naics_codes if opportunity.naics_codes else None
        )
        org_network_vsbe = self._calculate_network_capacity(
            org_network,
            cert_type='VSBE',
            naics_codes=opportunity.naics_codes if opportunity.naics_codes else None
        )

        assessment_data["organization_network_mbe_count"] = org_network_mbe["count"]
        assessment_data["organization_network_vsbe_count"] = org_network_vsbe["count"]

        # 2. Find additional available subcontractors from directory
        matching_subs_mbe = []
        matching_subs_vsbe = []

        if opportunity.naics_codes and jurisdiction:
            # Find MBE subcontractors from directory
            if opportunity.mbe_goal and opportunity.mbe_goal > 0:
                matching_subs_mbe = self.subcontractor_service.get_matching_subcontractors(
                    naics_codes=opportunity.naics_codes,
                    jurisdiction_code=jurisdiction.code,
                    is_mbe=True,
                    min_rating=2.0
                )

            # Find VSBE subcontractors from directory
            if opportunity.vsbe_goal and opportunity.vsbe_goal > 0:
                matching_subs_vsbe = self.subcontractor_service.get_matching_subcontractors(
                    naics_codes=opportunity.naics_codes,
                    jurisdiction_code=jurisdiction.code,
                    is_vsbe=True,
                    min_rating=2.0
                )

        # Total matching includes both org network and directory
        total_matching = len(set([s.id for s in matching_subs_mbe + matching_subs_vsbe]))
        assessment_data["available_subcontractors_count"] = total_matching

        # Convert subcontractors to dicts for serialization - manually to avoid relationship issues
        matching_subs_dicts = [
            {
                "id": str(sub.id),
                "legal_name": sub.legal_name,
                "federal_id": sub.federal_id,
                "certifications": sub.certifications,
                "jurisdiction_codes": sub.jurisdiction_codes,
                "naics_codes": sub.naics_codes,
                "capabilities": sub.capabilities,
                "contact_email": sub.contact_email,
                "phone": sub.phone,
                "location_city": sub.location_city,
                "rating": float(sub.rating) if sub.rating else 0.0,
                "projects_completed": sub.projects_completed,
                "is_verified": sub.is_verified,
                "created_at": sub.created_at.isoformat() if sub.created_at else None
            }
            for sub in matching_subs_mbe[:10]
        ]
        assessment_data["matching_subcontractors"] = matching_subs_dicts
        
        # 2. Calculate MBE gap (considering both org network and directory)
        if opportunity.mbe_goal and opportunity.mbe_goal > 0:
            total_mbe_available = org_network_mbe["count"] + len(matching_subs_mbe)

            if org_network_mbe["count"] == 0 and len(matching_subs_mbe) == 0:
                # No MBE subs at all - critical
                assessment_data["mbe_gap_percentage"] = -opportunity.mbe_goal
                risk_score += 40
                risk_factors.append(
                    f"CRITICAL: No MBE subcontractors in your network or directory. "
                    f"Need {opportunity.mbe_goal}% participation."
                )
            elif org_network_mbe["count"] >= 3:
                # Organization has sufficient MBE network - excellent
                assessment_data["mbe_gap_percentage"] = Decimal('0.0')
                risk_factors.append(
                    f"EXCELLENT: You have {org_network_mbe['count']} MBE subcontractors in your network "
                    f"to meet {opportunity.mbe_goal}% goal."
                )
            elif total_mbe_available < 3:
                # Limited options overall
                assessment_data["mbe_gap_percentage"] = Decimal('-10.0')
                risk_score += 25
                risk_factors.append(
                    f"WARNING: Only {total_mbe_available} MBE subcontractors available "
                    f"({org_network_mbe['count']} in your network, {len(matching_subs_mbe)} in directory). "
                    f"Limited options to meet {opportunity.mbe_goal}% goal."
                )
            else:
                # Sufficient combined resources
                assessment_data["mbe_gap_percentage"] = Decimal('0.0')
                risk_factors.append(
                    f"GOOD: {total_mbe_available} MBE subcontractors available "
                    f"({org_network_mbe['count']} in your network, {len(matching_subs_mbe)} in directory) "
                    f"to meet {opportunity.mbe_goal}% goal."
                )

        # 3. Calculate VSBE gap (considering both org network and directory)
        if opportunity.vsbe_goal and opportunity.vsbe_goal > 0:
            total_vsbe_available = org_network_vsbe["count"] + len(matching_subs_vsbe)

            if org_network_vsbe["count"] == 0 and len(matching_subs_vsbe) == 0:
                # No VSBE subs at all
                assessment_data["vsbe_gap_percentage"] = -opportunity.vsbe_goal
                risk_score += 20
                risk_factors.append(
                    f"WARNING: No VSBE subcontractors in your network or directory. "
                    f"Need {opportunity.vsbe_goal}% participation."
                )
            elif org_network_vsbe["count"] >= 2:
                # Organization has sufficient VSBE network
                assessment_data["vsbe_gap_percentage"] = Decimal('0.0')
                risk_factors.append(
                    f"GOOD: You have {org_network_vsbe['count']} VSBE subcontractors in your network."
                )
            elif total_vsbe_available < 2:
                # Limited options
                assessment_data["vsbe_gap_percentage"] = Decimal('-5.0')
                risk_score += 10
                risk_factors.append(
                    f"CAUTION: Only {total_vsbe_available} VSBE subcontractors available "
                    f"({org_network_vsbe['count']} in your network, {len(matching_subs_vsbe)} in directory)."
                )
            else:
                assessment_data["vsbe_gap_percentage"] = Decimal('0.0')
                risk_factors.append(
                    f"GOOD: {total_vsbe_available} VSBE subcontractors available."
                )
        
        # 4. Check opportunity value
        if opportunity.total_value:
            if opportunity.total_value > 10000000:  # $10M+
                risk_score += 15
                risk_factors.append(
                    "CAUTION: High-value contract ($10M+) requires strong team and capacity."
                )
            elif opportunity.total_value < 100000:  # Under $100k
                risk_factors.append(
                    "INFO: Small contract value may have lower margins."
                )
        
        # 5. Check due date
        if opportunity.due_date:
            from datetime import date, timedelta
            days_until_due = (opportunity.due_date - date.today()).days
            
            if days_until_due < 7:
                risk_score += 30
                risk_factors.append(
                    f"CRITICAL: Only {days_until_due} days until due date. Very tight timeline."
                )
            elif days_until_due < 14:
                risk_score += 15
                risk_factors.append(
                    f"WARNING: Only {days_until_due} days until due date. Limited prep time."
                )
            else:
                risk_factors.append(
                    f"GOOD: {days_until_due} days until due date. Adequate preparation time."
                )
        
        # 6. Calculate overall risk score (0-100, higher = more risk)
        assessment_data["overall_risk_score"] = min(risk_score, 100)
        assessment_data["risk_factors"] = risk_factors
        
        # 7. Generate recommendation
        if risk_score >= 60:
            assessment_data["recommendation"] = "NO_BID"
            assessment_data["recommendation_reason"] = (
                "HIGH RISK: Significant compliance gaps or timing constraints. "
                "Recommend passing on this opportunity."
            )
        elif risk_score >= 30:
            assessment_data["recommendation"] = "CAUTION"
            assessment_data["recommendation_reason"] = (
                "MODERATE RISK: Some concerns identified. "
                "Proceed with careful planning and strong subcontractor commitments."
            )
        else:
            assessment_data["recommendation"] = "BID"
            assessment_data["recommendation_reason"] = (
                "LOW RISK: Good subcontractor availability and reasonable timeline. "
                "Strong opportunity to pursue."
            )
        
        # 8. Save the assessment
        assessment = PreBidAssessment(
            organization_id=assessment_data["organization_id"],
            opportunity_id=assessment_data["opportunity_id"],
            overall_risk_score=assessment_data["overall_risk_score"],
            mbe_gap_percentage=assessment_data["mbe_gap_percentage"],
            vsbe_gap_percentage=assessment_data["vsbe_gap_percentage"],
            available_subcontractors_count=assessment_data["available_subcontractors_count"],
            recommendation=assessment_data["recommendation"],
            recommendation_reason=assessment_data["recommendation_reason"]
        )
        
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        
        # Return full assessment data including transient fields
        # Manually construct opportunity dict to avoid serialization issues
        opportunity_dict = {
            "id": str(opportunity.id),
            "solicitation_number": opportunity.solicitation_number,
            "title": opportunity.title,
            "jurisdiction_id": str(opportunity.jurisdiction_id),
            "agency": opportunity.agency,
            "mbe_goal": float(opportunity.mbe_goal) if opportunity.mbe_goal else None,
            "vsbe_goal": float(opportunity.vsbe_goal) if opportunity.vsbe_goal else None,
            "total_value": float(opportunity.total_value) if opportunity.total_value else None,
            "naics_codes": opportunity.naics_codes,
            "due_date": opportunity.due_date.isoformat() if opportunity.due_date else None,
            "posted_date": opportunity.posted_date.isoformat() if opportunity.posted_date else None,
            "opportunity_url": opportunity.opportunity_url,
            "is_active": opportunity.is_active,
            "relevance_score": opportunity.relevance_score
        }

        # Return with all JSON-serializable types
        return {
            "id": str(assessment.id),
            "assessed_at": assessment.assessed_at.isoformat(),
            "organization_id": str(assessment_data["organization_id"]),
            "opportunity_id": str(assessment_data["opportunity_id"]),
            "overall_risk_score": assessment_data["overall_risk_score"],
            "mbe_gap_percentage": float(assessment_data["mbe_gap_percentage"]),
            "vsbe_gap_percentage": float(assessment_data["vsbe_gap_percentage"]),
            "available_subcontractors_count": assessment_data["available_subcontractors_count"],
            "recommendation": assessment_data["recommendation"],
            "recommendation_reason": assessment_data["recommendation_reason"],
            "risk_factors": assessment_data["risk_factors"],
            "matching_subcontractors": assessment_data["matching_subcontractors"],
            "opportunity": opportunity_dict,
            # NEW: Include organization network statistics
            "organization_network": {
                "total_count": assessment_data["organization_network_count"],
                "mbe_count": assessment_data["organization_network_mbe_count"],
                "vsbe_count": assessment_data["organization_network_vsbe_count"]
            }
        }
    
    def get_assessment_summary_by_organization(
        self, 
        organization_id: UUID
    ) -> Dict:
        """Get summary statistics of assessments for an organization"""
        assessments = self.get_assessments_by_organization(organization_id)
        
        total = len(assessments)
        bid_count = sum(1 for a in assessments if a.recommendation == "BID")
        caution_count = sum(1 for a in assessments if a.recommendation == "CAUTION")
        no_bid_count = sum(1 for a in assessments if a.recommendation == "NO_BID")
        
        avg_risk_score = sum(a.overall_risk_score or 0 for a in assessments) / total if total > 0 else 0
        
        return {
            "total_assessments": total,
            "bid_recommended": bid_count,
            "caution_recommended": caution_count,
            "no_bid_recommended": no_bid_count,
            "average_risk_score": round(avg_risk_score, 2)
        }