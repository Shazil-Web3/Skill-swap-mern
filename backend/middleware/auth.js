const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
      console.log('Verifying token:', token);
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified payload:', verified);
      
      // Only check roles if they are specified
      if (roles && roles.length > 0 && !roles.includes(verified.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      // Add user ID to request - handle both _id and id from token
      req.user = {
        _id: verified.id,
        id: verified.id,
        email: verified.email,
        role: verified.role
      };
      
      console.log('User set in request:', req.user);
      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

module.exports = authMiddleware;
