/**
 * AgriWise: Role-Based Access Control Middleware
 * Enforces strict boundary between Farmer and Admin capabilities.
 */

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires [${roles.join(', ')}] privileges. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

const requireFarmer = requireRole(['farmer']);
const requireAdmin = requireRole(['admin']);

module.exports = {
  requireRole,
  requireFarmer,
  requireAdmin
};
