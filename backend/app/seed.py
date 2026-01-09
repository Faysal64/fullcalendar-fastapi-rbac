from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.models.rbac import Role, Permission
from app.core.security import hash_password


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

# ✅ Permission(s) à donner à l'admin (ajuste si ton admin.py attend un autre code)
PERM_CREATE_USER = "admin:create_user"


def main():
    db: Session = SessionLocal()
    try:
        # 1) Créer ou récupérer la permission
        perm = db.query(Permission).filter(Permission.code == PERM_CREATE_USER).first()
        if not perm:
            perm = Permission(code=PERM_CREATE_USER, description="Create users")
            db.add(perm)
            db.commit()
            db.refresh(perm)

        # 2) Créer ou récupérer le rôle admin
        role_admin = db.query(Role).filter(Role.name == "admin").first()
        if not role_admin:
            role_admin = Role(name="admin")
            db.add(role_admin)
            db.commit()
            db.refresh(role_admin)

        # 3) Attacher la permission au rôle admin
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
