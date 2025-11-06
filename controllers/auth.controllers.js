// import express from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import { auth } from '../middleware/auth.js';
// import multer from 'multer';
// import path from 'path';


// // ✅ Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/avatars'); // Folder where avatars will be saved
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// // ✅ File filter (only images)
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) cb(null, true);
//   else cb(new Error('Only image files are allowed!'), false);
// };

// // ✅ Multer middleware
// export const upload = multer({ storage, fileFilter });

// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;


//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }

//     // Create new user
//     const user = new User({
//       name,
//       email,
//       password,
//       phone
//     });

//     await user.save();

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );

//     res.status(201).json({
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: 'Server error during registration' });
//   }
// }

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Check password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         phone: user.phone
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// }

// // ✅ FIX: Improved getCurrentUser function
// export const getCurrentUser = async (req, res) => {
//   try {
//     console.log('🔍 Fetching current user for ID:', req.userId); // Debug log

//     const user = await User.findById(req.userId).select('-password');

//     if (!user) {
//       console.log('❌ User not found for ID:', req.userId);
//       return res.status(404).json({ message: 'User not found' });
//     }

//     console.log('✅ User found:', { id: user._id, name: user.name, email: user.email }); // Debug log

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role,
//       avatar: user.avatar
//     });
//   } catch (error) {
//     console.error('❌ Get user error:', error);
//     res.status(500).json({
//       message: 'Server error while fetching user',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }

// // ✅ FIX: Improved updateProfile function

// export const updateProfile = async (req, res) => {
//   try {
//     const { name, phone } = req.body;
//     const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : req.body.avatar;

//     console.log('Updating profile for user:', req.userId);

//     const user = await User.findByIdAndUpdate(
//       req.userId,
//       { name, phone, avatar },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     res.json({
//       message: 'Profile updated successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         avatar: user.avatar
//       }
//     });
//   } catch (error) {
//     console.error('❌ Update profile error:', error);
//     res.status(500).json({ message: 'Server error while updating profile' });
//   }
// };


// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Verify current password
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Current password is incorrect' });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Ensure upload folder exists
const uploadPath = 'uploads/avatars';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ File filter (only images allowed)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

// ✅ Multer middleware
export const upload = multer({ storage, fileFilter });

// ------------------ REGISTER USER ------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ------------------ LOGIN USER ------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ------------------ GET CURRENT USER ------------------
export const getCurrentUser = async (req, res) => {
  try {
    console.log('🔍 Fetching current user for ID:', req.userId);
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

// ------------------ UPDATE PROFILE ------------------
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    let avatar = null;

    console.log('📝 Update Profile Request by:', req.userId);

    if (req.file) {
      avatar = `/uploads/avatars/${req.file.filename}`;
      console.log('✅ Avatar uploaded:', avatar);
    } else if (req.body.avatar) {
      avatar = req.body.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar ? `${req.protocol}://${req.get('host')}${updatedUser.avatar}` : null
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// ------------------ CHANGE PASSWORD ------------------
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
