from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.core.security import hash_password
from app.core.rbac import user_has_permission

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateUserIn(BaseModel):
    email: str
    password: str


@router.post("/users")
def create_user(
    payload: CreateUserIn,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if not user_has_permission(me, "admin:create_user"):
        raise HTTPException(status_code=403, detail="Forbidden")

    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "email": user.email, "is_active": user.is_active}


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if not user_has_permission(me, "admin:create_user"):
        raise HTTPException(status_code=403, detail="Forbidden")

    users = db.query(User).order_by(User.id.asc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "is_active": u.is_active,
        }
        for u in users
    ]


# ✅ AJOUT: supprimer un user (admin only)
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    # même permission que create/list chez toi
    if not user_has_permission(me, "admin:create_user"):
        raise HTTPException(status_code=403, detail="Forbidden")

    # optionnel mais conseillé: éviter l'auto-suppression
    if getattr(me, "id", None) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"ok": True}
