"""
Authentication routes for user registration and login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import SessionLocal
from app.models.user import User
from app.models.portfolio import Portfolio
from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_db,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None = None
    bio: str | None = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    full_name: str | None = None
    bio: str | None = None
    password: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Validate password length (bcrypt limit is 72 bytes)
        password_bytes = len(user_data.password.encode('utf-8'))
        if password_bytes > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too long. Maximum 72 characters allowed."
            )
        
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )
        
        # Check if username exists
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create portfolio for user
        portfolio = Portfolio(user_id=user.id, balance=100000.0)
        db.add(portfolio)
        db.commit()
        
        return user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"Registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    # OAuth2PasswordRequestForm uses the field name "username" by spec.
    # In this app we treat that value as the user's email for login.
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile info and/or change password."""
    # Username update
    if profile_data.username is not None and profile_data.username != current_user.username:
        if db.query(User).filter(User.username == profile_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        current_user.username = profile_data.username

    # Email update
    if profile_data.email is not None and profile_data.email != current_user.email:
        if db.query(User).filter(User.email == profile_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = profile_data.email

    # Full name and bio updates
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio

    # Password update
    if profile_data.password is not None:
        password_bytes = len(profile_data.password.encode('utf-8'))
        if password_bytes > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too long. Maximum 72 characters allowed."
            )
        if len(profile_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )
        current_user.hashed_password = get_password_hash(profile_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user

