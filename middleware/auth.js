// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '') ||
//       req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
//     const user = await User.findById(decoded.userId).select('-password');

//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.userId = user._id;
//     req.user = user; 
   
//     next();
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// const adminAuth = async (req, res, next) => {
//   try {
//     await auth(req, res, () => {
//       if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied. Admin role required.' });
//       }
//       next();
//     });
//   } catch (error) {
//     res.status(401).json({ message: 'Authorization failed' });
//   }
// };

// const ownerAuth = async (req, res, next) => {
//   try {
//     await auth(req, res, () => {
//       if (!['admin', 'owner'].includes(req.user.role)) {
//         return res.status(403).json({ message: 'Access denied. Owner or Admin role required.' });
//       }
//       next();
//     });
//   } catch (error) {
//     res.status(401).json({ message: 'Authorization failed' });
//   }
// };

// export { auth, adminAuth, ownerAuth };


import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Generic user authentication middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token, user not found' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Token is not valid or expired' });
  }
};




export const adminAuth = [auth, (req, res, next) => {
  console.log('🔐 Admin auth check:', {
    userId: req.userId,
    userRole: req.user?.role,
    isAdmin: req.user?.role === 'admin'
  });
  
  if (req.user.role !== 'admin') {
    console.log('❌ Admin access denied for role:', req.user?.role);
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  console.log('✅ Admin access granted');
  next();
}];

// ✅ Owner or Admin route protection
export const ownerAuth = [auth, (req, res, next) => {
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Owner or Admin role required.' });
  }
  next();
}];


// ✅ Admin-only route protection
// export const adminAuth = [auth, (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Access denied. Admin role required.' });
//   }
//   next();
// }]; 