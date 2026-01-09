def user_has_permission(user, perm_code: str) -> bool:
    for role in user.roles:
        for perm in role.permissions:
            if perm.code == perm_code:
                return True
    return False
