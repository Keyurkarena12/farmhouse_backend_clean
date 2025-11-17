import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import  {auth}  from '../middleware/auth.js';
import { changePassword, forgotPassword, getCurrentUser, googleLogin, loginUser, registerUser, updateProfile, upload, verifyOtpAndReset } from '../controllers/auth.controllers.js';

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

// Forgot Password - Send OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP & Reset Password
router.post('/reset-password', verifyOtpAndReset);

router.post('/google-login', googleLogin);



export default router;


