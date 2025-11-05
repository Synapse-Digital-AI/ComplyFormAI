from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Dict
from app.schemas.jurisdiction import Jurisdiction

class ComplianceRuleBase(BaseModel):
    jurisdiction_id: UUID
    rule_name: str
    rule_type: str  # 'MBE', 'VSBE', 'LOCAL_PREF', 'DBE', etc.
    rule_definition: Dict
    severity: Optional[str] = 'ERROR'  # 'ERROR' or 'WARNING'

class ComplianceRuleCreate(ComplianceRuleBase):
    pass

class ComplianceRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    rule_definition: Optional[Dict] = None
    severity: Optional[str] = None

class ComplianceRule(ComplianceRuleBase):
    id: UUID
    
    class Config:
        from_attributes = True

class ComplianceRuleDetail(ComplianceRule):
    jurisdiction: Optional[Jurisdiction] = None

    class Config:
        from_attributes = True