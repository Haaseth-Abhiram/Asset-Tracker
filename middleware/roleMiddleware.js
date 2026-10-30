function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.length) {
      return next();
    }

    const userRole = req.user.role || 'Workspace user';
    const isAllowed = allowedRoles.some((role) => role.toLowerCase() === userRole.toLowerCase());

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access requires ${allowedRoles.join(' or ')} privileges.`
      });
    }

    next();
  };
}

module.exports = { roleMiddleware };
