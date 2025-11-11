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


