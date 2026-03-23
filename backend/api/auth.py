from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.auth import authenticate_user, create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.crud.user_crud import create_user, get_user_by_email
from backend.schemas.scan import UserCreate, UserOut
from backend.models.scan import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, user)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": UserOut.from_orm(user)}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    # In a real app, you might blacklist the token
    return {"message": "Logged out successfully"}

import os
import requests
import uuid
from fastapi.responses import RedirectResponse
from backend.auth import get_password_hash

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")

@router.get("/github/login")
def github_login():
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured")
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email repo&prompt=consent"
    return RedirectResponse(url=github_auth_url)

@router.get("/github/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub Client ID/Secret not configured")
        
    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
    }
    
    response = requests.post(token_url, headers=headers, data=data)
    token_data = response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to get GitHub access token")
        
    user_url = "https://api.github.com/user"
    user_headers = {"Authorization": f"Bearer {access_token}"}
    user_resp = requests.get(user_url, headers=user_headers)
    github_user = user_resp.json()
    
    # get emails
    email_resp = requests.get(user_url + "/emails", headers=user_headers)
    emails = email_resp.json()
    primary_email = next((e["email"] for e in emails if e["primary"]), None)
    
    if not primary_email:
        raise HTTPException(status_code=400, detail="No primary email from GitHub")
        
    db_user = get_user_by_email(db, email=primary_email)
    
    if not db_user:
        username = github_user.get("login")
        # generate random placeholder password
        from backend.schemas.scan import UserCreate
        new_user = UserCreate(
            username=username,
            email=primary_email,
            password=str(uuid.uuid4())
        )
        db_user = create_user(db, new_user)
        
    db_user.github_access_token = access_token
    db.commit()
    db.refresh(db_user)
        
    # generate our own jwt
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    # redirect to frontend dashboard with token in url
    from backend.config import FRONTEND_URL
    return RedirectResponse(url=f"{FRONTEND_URL}/?token={app_token}")