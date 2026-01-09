from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.core.rbac import user_has_permission


# ✅ Lit automatiquement: Authorization: Bearer <token>
bearer_scheme = HTTPBearer(auto_error=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    # credentials.scheme == "Bearer"
    token = credentials.credentials

    try:
        payload = decode_token(token)
        email = payload.get("sub")
        if not email:
            raise ValueError("no sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found/inactive")

    return user


def require_permission(code: str):
    def _dep(user: User = Depends(get_current_user)):
        if not user_has_permission(user, code):
            raise HTTPException(status_code=403, detail=f"Missing permission: {code}")
        return True

    return _dep
