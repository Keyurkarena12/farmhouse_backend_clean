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
import crypto from 'crypto';
import { sendOtpEmail } from '../config/nodemailer.js';

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
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      avatarUrl = uploadResult.secure_url;
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


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------ VERIFY OTP & RESET PASSWORD ------------------
export const verifyOtpAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Reset password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

