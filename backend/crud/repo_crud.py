from sqlalchemy.orm import Session
from backend.models.scan import Repository
from backend.schemas.scan import RepositoryCreate, RepositoryOut
from typing import List

def create_repository(db: Session, repo: RepositoryCreate) -> Repository:
    db_repo = Repository(**repo.dict())
    db.add(db_repo)
    db.commit()
    db.refresh(db_repo)
    return db_repo

def get_repository_by_id(db: Session, repo_id: int) -> Repository:
    return db.query(Repository).filter(Repository.id == repo_id).first()

def get_repository_by_url(db: Session, url: str) -> Repository:
    return db.query(Repository).filter(Repository.url == url).first()

def list_repositories(db: Session, skip: int = 0, limit: int = 100) -> List[Repository]:
    return db.query(Repository).offset(skip).limit(limit).all()

def update_repository(db: Session, repo_id: int, updates: dict) -> Repository:
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if repo:
        for key, value in updates.items():
            setattr(repo, key, value)
        db.commit()
        db.refresh(repo)
    return repo

def delete_repository(db: Session, repo_id: int) -> bool:
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if repo:
        db.delete(repo)
        db.commit()
        return True
    return False