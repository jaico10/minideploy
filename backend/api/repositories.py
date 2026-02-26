from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth import get_current_active_user
from backend.crud.repo_crud import create_repository, get_repository_by_id, get_repository_by_url, list_repositories
from backend.schemas.scan import RepositoryCreate, RepositoryOut
from backend.models.scan import User

router = APIRouter(prefix="/repositories", tags=["repositories"])

@router.post("/", response_model=RepositoryOut)
def create_repo(repo: RepositoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_repo = get_repository_by_url(db, url=repo.url)
    if db_repo:
        raise HTTPException(status_code=400, detail="Repository already exists")
    return create_repository(db, repo)

@router.get("/", response_model=list[RepositoryOut])
def read_repos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    repos = list_repositories(db, skip=skip, limit=limit)
    return repos

@router.get("/{repo_id}", response_model=RepositoryOut)
def read_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    repo = get_repository_by_id(db, repo_id=repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo