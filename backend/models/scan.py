from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base
import enum

class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    PROGRESS = "progress"
    COMPLETED = "completed"
    FAILED = "failed"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class VulnerabilityType(str, enum.Enum):
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    CSRF = "csrf"
    AUTH_BYPASS = "auth_bypass"
    OTHER = "other"

class AuditAction(str, enum.Enum):
    LOGIN = "login"
    SCAN_START = "scan_start"
    SCAN_COMPLETE = "scan_complete"
    REPORT_GENERATE = "report_generate"
    USER_CREATE = "user_create"

# Users table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    github_access_token = Column(String, nullable=True)

    # Relationships
    scans = relationship("Scan", back_populates="user")
    reports = relationship("Report", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

# Repositories table
class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    last_scanned = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scans = relationship("Scan", back_populates="repository")

# Scans table
class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    results = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    risk_score = Column(Integer, nullable=True)
    severity = Column(Enum(SeverityLevel), nullable=True)
    total_files = Column(Integer, nullable=True)
    issues_count = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="scans")
    repository = relationship("Repository", back_populates="scans")
    scan_results = relationship("ScanResult", back_populates="scan")
    reports = relationship("Report", back_populates="scan")

# Scan Results table
class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    file_path = Column(String, nullable=False)
    vulnerable = Column(Boolean, default=False)
    line_number = Column(Integer, nullable=True)
    vuln_type = Column(String, nullable=True) # e.g. "SQL_INJECTION"
    explanation = Column(Text, nullable=True) # LLM explanation
    scanned_code = Column(Text, nullable=True) # Original code block
    fixed_code = Column(Text, nullable=True) # Fixed code block
    finding_details = Column(JSON, nullable=True) # Store complex findings
    error = Column(Text, nullable=True)
    vulnerability_id = Column(Integer, ForeignKey("vulnerabilities.id"), nullable=True)

    # Relationships
    scan = relationship("Scan", back_populates="scan_results")
    vulnerability = relationship("Vulnerability", back_populates="scan_results")

# Vulnerabilities table
class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(VulnerabilityType), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(SeverityLevel), nullable=False)
    cwe_id = Column(String, nullable=True)  # Common Weakness Enumeration
    owasp_id = Column(String, nullable=True)  # OWASP Top 10
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scan_results = relationship("ScanResult", back_populates="vulnerability")

# Reports table
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    file_path = Column(String, nullable=True)  # Path to generated report file

    # Relationships
    scan = relationship("Scan", back_populates="reports")
    user = relationship("User", back_populates="reports")

# Audit Logs table
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(Enum(AuditAction), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs")
