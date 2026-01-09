from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.auth import LoginIn, TokenOut
from app.models.user import User
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Bad credentials")
    return TokenOut(access_token=create_access_token(sub=user.email))

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"email": user.email, "roles": user.roles or []}
