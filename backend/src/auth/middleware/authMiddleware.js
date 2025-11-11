const authService = require('../services/authService');

/**
 * Authentication middleware for JWT token verification
 */
class AuthMiddleware {
  /**
   * Verify JWT access token from Authorization header
   * Attaches user data to req.user if token is valid
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Access token required'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Access token required'
        });
      }

      // Verify token
      const decoded = authService.verifyToken(token);

      // Attach user data to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      if (error.message === 'Token expired') {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Access token expired'
        });
      } else if (error.message === 'Invalid token') {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Invalid access token'
        });
      } else {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Authentication failed'
        });
      }
    }
  }

  /**
   * Role-based access control middleware
   * Checks if user has required role(s)
   * @param {string|string[]} allowedRoles - Single role or array of allowed roles
   * @returns {Function} Middleware function
   */
  authorize(allowedRoles) {
    return (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'AuthenticationError',
            message: 'Authentication required'
          });
        }

        const userRole = req.user.role;

        // Convert single role to array for consistent checking
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Check if user role is in allowed roles
        if (!roles.includes(userRole)) {
          return res.status(403).json({
            error: 'AuthorizationError',
            message: 'Insufficient permissions'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'Authorization check failed'
        });
      }
    };
  }

  /**
   * Admin-only access middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  adminOnly(req, res, next) {
    return this.authorize('ADMIN')(req, res, next);
  }

  /**
   * Manager and Admin access middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  managerAndAbove(req, res, next) {
    return this.authorize(['ADMIN', 'MANAGER'])(req, res, next);
  }

  /**
   * All authenticated users access middleware (Cashier, Manager, Admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  authenticatedOnly(req, res, next) {
    return this.authorize(['ADMIN', 'MANAGER', 'CASHIER'])(req, res, next);
  }
}

module.exports = new AuthMiddleware();