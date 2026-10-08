"""
SSGMCE College ERP — Role-Based Access Control (RBAC) Module
"""

from backend.rbac.models import (
    RoleName,
    Permission,
    PERMISSION_ALIASES,
    normalize_permission,
    RoleMetadata
)
from backend.rbac.matrix import (
    ROLE_PERMISSION_MATRIX,
    get_default_permissions_for_role
)
from backend.rbac.service import RBACService
from backend.rbac.dependencies import (
    require_permission,
    require_any_permission,
    require_all_permissions,
    require_role
)

__all__ = [
    "RoleName",
    "Permission",
    "PERMISSION_ALIASES",
    "normalize_permission",
    "RoleMetadata",
    "ROLE_PERMISSION_MATRIX",
    "get_default_permissions_for_role",
    "RBACService",
    "require_permission",
    "require_any_permission",
    "require_all_permissions",
    "require_role"
]

