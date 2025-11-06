import express from 'express';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { DeleteUser, getAdminStatistics, GetAllUser, GetUserById, GetUserStatistics, UpdateUser } from '../controllers/users.controllers.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', adminAuth,GetAllUser);

// Get user by ID
router.get('/:id', auth,GetUserById);

// Update user role (admin only)
router.put('/:id/role', adminAuth,UpdateUser);

// Get user statistics
router.get('/:id/stats', auth,GetUserStatistics );

// Delete user (admin only)
router.delete('/:id', adminAuth,DeleteUser);

// Add this route to your user routes
router.get('/admin/statistics', auth, getAdminStatistics);

export default router;
