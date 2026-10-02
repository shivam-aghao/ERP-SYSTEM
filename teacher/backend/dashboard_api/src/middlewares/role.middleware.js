import { ApiError } from '../utils/ApiError.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user && !req.faculty) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user?.role || req.faculty?.role || 'faculty';

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole) && userRole !== 'admin') {
      return next(new ApiError(403, `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`));
    }

    next();
  };
};

export default requireRole;

