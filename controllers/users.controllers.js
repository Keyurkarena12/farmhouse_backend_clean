import express from 'express';
import User from '../models/User.js';
import Booking from '../models/Booking.js'; 
import Farmhouse from '../models/Farmhouse.js';

export const GetAllUser = async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
  
      const filter = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }
  
      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
  
      const total = await User.countDocuments(filter);
  
      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

export const GetUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if user can view this profile
      if (user._id.toString() !== req.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this profile' });
      }
  
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } 
  
export const UpdateUser =  async (req, res) => {
    try {
      const { role } = req.body;
  
      if (!['user', 'admin', 'owner'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
  
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      ).select('-password');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({
        message: 'User role updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }  

export const GetUserStatistics = async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Check authorization
      if (userId !== req.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this data' });
      }
  
      const [
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent
      ] = await Promise.all([
        Booking.countDocuments({ user: userId }),
        Booking.countDocuments({ user: userId, status: 'completed' }),
        Booking.countDocuments({ user: userId, status: 'cancelled' }),
        Booking.aggregate([
          { $match: { user: userId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ])
      ]);
  
      res.json({
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent: totalSpent[0]?.total || 0
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }  

export const DeleteUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if trying to delete own account
      if (user._id.toString() === req.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
  
      await User.findByIdAndDelete(req.params.id);
  
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }  


  export const getAdminStatistics = async (req, res) => {
  try {
    console.log('=== ADMIN STATISTICS REQUEST ===');
    console.log('User ID:', req.userId);
    console.log('User Role:', req.user?.role);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const [
      totalUsers,
      totalFarmhouses,
      totalBookings,
      pendingApprovals
    ] = await Promise.all([
      // Total Users
      User.countDocuments({}),
      // Total Farmhouses
      Farmhouse.countDocuments({}),
      // Total Bookings
      Booking.countDocuments({}),
      // Pending Farmhouse Approvals
      Farmhouse.countDocuments({ approvalStatus: 'pending' })
    ]);

    console.log('📊 Admin Statistics:', {
      totalUsers,
      totalFarmhouses,
      totalBookings,
      pendingApprovals
    });

    res.json({
      totalUsers,
      totalFarmhouses,
      totalBookings,
      pendingApprovals
    });

  } catch (error) {
    console.error('❌ Get admin statistics error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching admin statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


