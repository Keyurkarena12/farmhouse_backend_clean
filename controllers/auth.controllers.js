// import express from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import { auth } from '../middleware/auth.js';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // ✅ Ensure upload folder exists
// const uploadPath = 'uploads/avatars';
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // ✅ Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // ✅ File filter (only images allowed)
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) cb(null, true);
//   else cb(new Error('Only image files are allowed!'), false);
// };

// // ✅ Multer middleware
// export const upload = multer({ storage, fileFilter });

// // ------------------ REGISTER USER ------------------
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }

//     const user = new User({ name, email, password, phone });
//     await user.save();

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
// };

// // ------------------ LOGIN USER ------------------
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

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
//         phone: user.phone,
//         avatar: user.avatar
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

// // ------------------ GET CURRENT USER ------------------
// export const getCurrentUser = async (req, res) => {
//   try {
//     console.log('🔍 Fetching current user for ID:', req.userId);
//     const user = await User.findById(req.userId).select('-password');

//     if (!user) {
//       console.log('❌ User not found');
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role,
//       avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null
//     });
//   } catch (error) {
//     console.error('❌ Get user error:', error);
//     res.status(500).json({ message: 'Server error while fetching user' });
//   }
// };

// // ------------------ UPDATE PROFILE ------------------
// export const updateProfile = async (req, res) => {
//   try {
//     const { name, phone } = req.body;
//     let avatar = null;

//     console.log('📝 Update Profile Request by:', req.userId);

//     if (req.file) {
//       avatar = `/uploads/avatars/${req.file.filename}`;
//       console.log('✅ Avatar uploaded:', avatar);
//     } else if (req.body.avatar) {
//       avatar = req.body.avatar;
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.userId,
//       { name, phone, avatar },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!updatedUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({
//       message: 'Profile updated successfully',
//       user: {
//         id: updatedUser._id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         phone: updatedUser.phone,
//         role: updatedUser.role,
//         avatar: updatedUser.avatar ? `${req.protocol}://${req.get('host')}${updatedUser.avatar}` : null
//       }
//     });
//   } catch (error) {
//     console.error('❌ Update profile error:', error);
//     res.status(500).json({ message: 'Server error while updating profile' });
//   }
// };

// // ------------------ CHANGE PASSWORD ------------------
// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

//     user.password = newPassword;
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import { auth } from '../middleware/auth.js';
// import cloudinary from '../config/cloudinary.js';
// import fs from 'fs';
// import multer from 'multer';
// import path from 'path';

// // Temporary local storage for upload (before Cloudinary)
// const upload = multer({ dest: 'temp/' });
// export { upload };

// // ------------------ REGISTER USER ------------------
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }

//     const user = new User({ name, email, password, phone });
//     await user.save();

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

//     res.status(201).json({
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: 'Server error during registration' });
//   }
// };

// // ------------------ LOGIN USER ------------------
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         phone: user.phone,
//         avatar: user.avatar,
//       },
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

// // ------------------ GET CURRENT USER ------------------
// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ message: 'Server error while fetching user' });
//   }
// };

// // ------------------ UPDATE PROFILE (Cloudinary) ------------------
// export const updateProfile = async (req, res) => {
//   try {
//     const { name, phone } = req.body;
//     const file = req.file;
//     let avatarUrl = null;

//     if (file) {
//       const uploadRes = await cloudinary.uploader.upload(file.path, {
//         folder: 'avatars',
//       });
//       avatarUrl = uploadRes.secure_url;
//       fs.unlinkSync(file.path); // remove local temp file
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.userId,
//       { name, phone, ...(avatarUrl && { avatar: avatarUrl }) },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!updatedUser) return res.status(404).json({ message: 'User not found' });

//     res.json({
//       message: 'Profile updated successfully',
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({ message: 'Server error while updating profile' });
//   }
// };

// // ------------------ CHANGE PASSWORD ------------------
// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

//     user.password = newPassword;
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import streamifier from 'streamifier';

// ✅ Use memory storage (since Vercel doesn’t allow writing files)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ------------------ GET CURRENT USER ------------------
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

// ------------------ UPDATE PROFILE (Cloudinary Stream Upload) ------------------
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const file = req.file;
    let avatarUrl = null;

    if (file) {
      // ✅ Upload file buffer directly to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      avatarUrl = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, ...(avatarUrl && { avatar: avatarUrl }) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
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
