import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import  {auth}  from '../middleware/auth.js';
import { changePassword, getCurrentUser, loginUser, registerUser, updateProfile, upload } from '../controllers/auth.controllers.js';

const router = express.Router();

// Register
router.post('/register',registerUser );

// Login
router.post('/login',loginUser);

// Get current user
router.get('/me', auth,getCurrentUser);

// Update profile
router.put('/profile', auth,upload.single('avatar'), updateProfile);

// Change password
router.put('/change-password', auth,changePassword);

export default router;


// import express from 'express';
// import Farmhouse from '../models/Farmhouse.js';
// import { auth, ownerAuth } from '../middleware/auth.js';
// import { 
//   CreateFarmhouse, 
//   DeleteFarmhouse, 
//   getAllFarmhouses, 
//   getSinglefarmhouse, 
//   getUsersFarmhouse, 
//   SearchFarmhouseByLocation, 
//   UpdateFarmhouse,
//   getOwnerFarmhouses
// } from '../controllers/farmhouses.controllers.js';

// const router = express.Router();

// // Get all farmhouses with filtering and pagination
// router.get('/', getAllFarmhouses);

// // Get single farmhouse
// router.get('/:id', getSinglefarmhouse);

// // Create farmhouse (owner/admin only)
// router.post('/', auth, CreateFarmhouse); // ✅ Change from ownerAuth to auth

// // Update farmhouse (owner/admin only)
// router.put('/:id', auth, UpdateFarmhouse); // ✅ Change from ownerAuth to auth

// // Delete farmhouse (owner/admin only)
// router.delete('/:id', auth, DeleteFarmhouse); // ✅ Change from ownerAuth to auth

// // Get ONLY current owner's farmhouses
// router.get('/owner/my-farmhouses', auth, getOwnerFarmhouses);

// // Get user's farmhouses (owner only)
// router.get('/my/farmhouses', auth, getUsersFarmhouse);

// // Search farmhouses by location
// router.get('/search/location', SearchFarmhouseByLocation);

// export default router;