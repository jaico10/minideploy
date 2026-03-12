from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.models.scan import ScanStatus, SeverityLevel, UserRole, VulnerabilityType, AuditAction

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[UserRole] = UserRole.USER

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RepositoryCreate(BaseModel):
    url: str
    name: str
    owner: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: Optional[int] = 0

class RepositoryOut(BaseModel):
    id: int
    url: str
    name: str
    owner: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    last_scanned: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ScanCreate(BaseModel):
    repo_url: str

class ScanOut(BaseModel):
    id: int
    task_id: str
    user_id: int
    repo_id: int
    status: ScanStatus
    created_at: datetime
    updated_at: Optional[datetime]
    total_files: Optional[int] = 0
    issues_count: Optional[int] = 0
    risk_score: Optional[float] = 0.0
    severity: Optional[SeverityLevel] = None

    class Config:
        from_attributes = True

class ScanResultOut(BaseModel):
    id: int
    file_path: str
    vulnerable: bool
    vuln_type: Optional[str]
    explanation: Optional[str]
    scanned_code: Optional[str]
    fixed_code: Optional[str]
    error: Optional[str]

    class Config:
        from_attributes = True

class ScanDetailOut(ScanOut):
    results: Optional[Dict[str, Any]]
    error_message: Optional[str]
    risk_score: Optional[int]
    severity: Optional[SeverityLevel]
    total_files: Optional[int]
    issues_count: Optional[int]
    completed_at: Optional[datetime]
    scan_results: List[ScanResultOut] = []

class VulnerabilityCreate(BaseModel):
    type: VulnerabilityType
    description: str
    severity: SeverityLevel
    cwe_id: Optional[str] = None
    owasp_id: Optional[str] = None

class VulnerabilityOut(BaseModel):
    id: int
    type: VulnerabilityType
    description: str
    severity: SeverityLevel
    cwe_id: Optional[str]
    owasp_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    scan_id: int
    title: str
    summary: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    scan_id: int
    user_id: int
    title: str
    summary: Optional[str]
    generated_at: datetime
    file_path: Optional[str]

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: AuditAction
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_scans: int
    completed_scans: int
    failed_scans: int
    pending_scans: int
    vulnerabilities_found: int
