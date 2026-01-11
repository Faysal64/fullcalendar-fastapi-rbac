from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.models.rbac import Role, Permission
from app.core.security import hash_password


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

# ✅ Permissions à donner à l'admin
PERM_CREATE_USER = "admin:create_user"
PERM_CALENDAR_READ = "calendar:read"
PERM_CALENDAR_WRITE = "calendar:write"


def get_or_create_perm(db: Session, code: str, description: str):
    perm = db.query(Permission).filter(Permission.code == code).first()
    if not perm:
        perm = Permission(code=code, description=description)
        db.add(perm)
        db.commit()
        db.refresh(perm)
    return perm


def main():
    db: Session = SessionLocal()
    try:
        # 1) Créer ou récupérer les permissions
        perm_create_user = get_or_create_perm(db, PERM_CREATE_USER, "Create users")
        perm_calendar_read = get_or_create_perm(db, PERM_CALENDAR_READ, "Read calendar events")
        perm_calendar_write = get_or_create_perm(db, PERM_CALENDAR_WRITE, "Write calendar events")

        # 2) Créer ou récupérer le rôle admin
        role_admin = db.query(Role).filter(Role.name == "admin").first()
        if not role_admin:
            role_admin = Role(name="admin")
            db.add(role_admin)
            db.commit()
            db.refresh(role_admin)

        # 3) Attacher les permissions au rôle admin
        for perm in [perm_create_user, perm_calendar_read, perm_calendar_write]:
            if perm not in role_admin.permissions:
                role_admin.permissions.append(perm)

        db.add(role_admin)
        db.commit()
        db.refresh(role_admin)

        # 4) Créer ou récupérer l'utilisateur admin
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            admin.is_active = True
            admin.hashed_password = hash_password(ADMIN_PASSWORD)
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 5) Attacher le rôle admin à l'utilisateur admin
        if role_admin not in admin.roles:
            admin.roles.append(role_admin)
            db.add(admin)
            db.commit()
            db.refresh(admin)

        print("✅ Seed OK")
        print(f"Admin: {admin.email}")
        print(f"Roles: {[r.name for r in admin.roles]}")
        print(f"Admin perms: {[p.code for p in role_admin.permissions]}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
