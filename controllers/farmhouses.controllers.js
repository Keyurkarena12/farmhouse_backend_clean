import Farmhouse from '../models/Farmhouse.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import mongoose from 'mongoose';

// Get ONLY current owner's farmhouses
export const getOwnerFarmhouses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = { owner: req.userId };

        if (search) {
            filter.$text = { $search: search };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const farmhouses = await Farmhouse.find(filter)
            .populate('owner', 'name email phone')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await Farmhouse.countDocuments(filter);

        res.json({
            farmhouses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            message: `Found ${total} farmhouse(s) for you`
        });
    } catch (error) {
        console.error('Get owner farmhouses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Public - get only APPROVED and active farmhouses
export const getAllFarmhouses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            city,
            state,
            minPrice,
            maxPrice,
            amenities,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // ✅ UPDATED: Only show approved and active farmhouses to public
        const filter = {
            isActive: true,
            approvalStatus: 'approved'
        };

        console.log('Fetching farmhouses with filter:', filter);

        if (search) {
            filter.$text = { $search: search };
        }

        if (city) filter['address.city'] = new RegExp(city, 'i');
        if (state) filter['address.state'] = new RegExp(state, 'i');

        if (minPrice || maxPrice) {
            filter['pricing.basePrice'] = {};
            if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
            if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
        }

        if (amenities) {
            const amenityList = amenities.split(',');
            filter['amenities.name'] = { $in: amenityList };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const farmhouses = await Farmhouse.find(filter)
            .populate('owner', 'name email phone')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await Farmhouse.countDocuments(filter);

        console.log(`Found ${farmhouses.length} approved farmhouses out of ${total} total`);

        res.json({
            farmhouses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get farmhouses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get single farmhouse (public - only approved and active)
export const getSinglefarmhouse = async (req, res) => {
    try {
        const filter = { _id: req.params.id };

        // For non-admin users, only show approved and active farmhouses
        if (!req.user || req.user.role !== 'admin') {
            filter.isActive = true;
            filter.approvalStatus = 'approved';
        }

        const farmhouse = await Farmhouse.findOne(filter)
            .populate('owner', 'name email phone')
            .select('-__v');

        if (!farmhouse) {
            return res.status(404).json({ message: 'Farmhouse not found' });
        }

        res.json(farmhouse);
    } catch (error) {
        console.error('Get farmhouse error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Create farmhouse - with ownership check and pending status
export const CreateFarmhouse = async (req, res) => {
    try {
        console.log('Creating farmhouse with data:', req.body);
        console.log('User ID:', req.userId);
        console.log('User Role:', req.user.role);

        if (req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Only farmhouse owners can create listings.'
            });
        }

        const requiredFields = ['name', 'description', 'address', 'pricing'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    message: `Missing required field: ${field}`
                });
            }
        }

        if (!req.body.address.city || !req.body.address.state) {
            return res.status(400).json({
                message: 'Address must include city and state'
            });
        }

        if (!req.body.pricing.basePrice) {
            return res.status(400).json({
                message: 'Pricing must include basePrice'
            });
        }

        let images = [];
        if (req.body.images && Array.isArray(req.body.images)) {
            images = req.body.images.map((img, index) => ({
                url: img.url || '',
                alt: img.alt || `Farmhouse image ${index + 1}`,
                isPrimary: img.isPrimary || (index === 0)
            }));
        }

        const farmhouseData = {
            ...req.body,
            owner: req.userId,
            images: images,
            location: req.body.location || { latitude: 0, longitude: 0 },
            amenities: req.body.amenities || [],
            rooms: req.body.rooms || [],
            contact: req.body.contact || {
                phone: '+91-0000000000',
                email: 'owner@example.com'
            },
            availability: req.body.availability || {
                checkInTime: '15:00',
                checkOutTime: '11:00',
                minimumStay: 1,
                maximumStay: 30,
                advanceBookingDays: 365,
                blockedDates: []
            },
            policies: req.body.policies || {
                cancellation: {
                    freeCancellation: true,
                    freeCancellationDays: 7,
                    partialRefundDays: 3
                },
                houseRules: ['No smoking', 'No pets', 'Check-in after 3 PM'],
                petPolicy: 'Not allowed',
                smokingPolicy: 'Not allowed'
            },
            // ✅ UPDATED: New farmhouses start as pending
            approvalStatus: 'pending',
            isActive: true,
            isVerified: false,
            featured: false
        };

        const farmhouse = new Farmhouse(farmhouseData);
        await farmhouse.save();

        await farmhouse.populate('owner', 'name email phone');

        res.status(201).json({
            message: 'Farmhouse created successfully and submitted for admin approval',
            farmhouse
        });
    } catch (error) {
        console.error('Create farmhouse error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Farmhouse with this name already exists'
            });
        }

        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
}

// Update farmhouse - with strict ownership check
export const UpdateFarmhouse = async (req, res) => {
    try {
        console.log('Update request details:', {
            farmhouseId: req.params.id,
            userId: req.userId,
            userRole: req.user.role,
            body: req.body
        });

        const farmhouse = await Farmhouse.findById(req.params.id).populate('owner', '_id name email role');

        if (!farmhouse) {
            return res.status(404).json({ message: 'Farmhouse not found' });
        }

        if (farmhouse.owner._id.toString() !== req.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. You can only update your own farmhouses.'
            });
        }

        const updatedFarmhouse = await Farmhouse.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('owner', 'name email phone');

        if (!updatedFarmhouse) {
            return res.status(404).json({ message: 'Farmhouse not found during update' });
        }

        res.json({
            message: 'Farmhouse updated successfully',
            farmhouse: updatedFarmhouse
        });
    } catch (error) {
        console.error('Update farmhouse error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid farmhouse ID'
            });
        }

        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
}

// Delete farmhouse - with strict ownership check
export const DeleteFarmhouse = async (req, res) => {
    try {
        const farmhouse = await Farmhouse.findById(req.params.id);

        if (!farmhouse) {
            return res.status(404).json({ message: 'Farmhouse not found' });
        }

        if (!farmhouse.owner.equals(req.userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. You can only delete your own farmhouses.'
            });
        }

        await Farmhouse.findByIdAndDelete(req.params.id);

        res.json({ message: 'Farmhouse deleted successfully' });
    } catch (error) {
        console.error('Delete farmhouse error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid farmhouse ID'
            });
        }

        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
}

// export const DeleteFarmhouse = async (req, res) => {
//   try {
//     const farmhouse = await Farmhouse.findById(req.params.id);
//     if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found' });

//     if (farmhouse.owner.toString() !== req.userId && req.role !== 'admin') {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     await farmhouse.deleteOne();
//     res.json({ message: 'Farmhouse deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting farmhouse:', error);
//     res.status(500).json({ message: 'Server error while deleting farmhouse' });
//   }
// };
// ✅ FIXED: Get pending farmhouses for admin
export const getPendingFarmhouses = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const filter = { approvalStatus: 'pending' };

        const farmhouses = await Farmhouse.find(filter)
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await Farmhouse.countDocuments(filter);

        res.json({
            farmhouses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get pending farmhouses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// ✅ FIXED: Approve farmhouse (admin only) - SIMPLIFIED
export const approveFarmhouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    console.log('=== APPROVE FARMHOUSE REQUEST ===');
    console.log('Farmhouse ID:', id);
    console.log('Admin User ID:', req.userId);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Basic ID validation
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid farmhouse ID' });
    }

    // Find the farmhouse
    const farmhouse = await Farmhouse.findById(id);

    if (!farmhouse) {
      return res.status(404).json({ message: 'Farmhouse not found' });
    }

    if (farmhouse.approvalStatus !== 'pending') {
      return res.status(400).json({
        message: `Farmhouse is not in pending status. Current status: ${farmhouse.approvalStatus}`
      });
    }

    // ✅ FIXED: Simple and clean update
    const updatedFarmhouse = await Farmhouse.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'approved',
        approvalDetails: {
          reviewedBy: req.userId,
          reviewedAt: new Date(),
          notes: notes || '',
          action: 'approved'
        },
        isActive: true
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('owner', 'name email phone');

    console.log('✅ Farmhouse approved successfully');

    res.json({
      message: 'Farmhouse approved successfully',
      farmhouse: updatedFarmhouse
    });

  } catch (error) {
    console.error('❌ APPROVE FARMHOUSE ERROR:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farmhouse ID' });
    }

    res.status(500).json({
      message: 'Server error while approving farmhouse',
      error: error.message
    });
  }
}

// ✅ FIXED: Reject farmhouse (admin only) - SIMPLIFIED
export const rejectFarmhouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, notes } = req.body;

        console.log('=== REJECT FARMHOUSE REQUEST ===');
        console.log('Farmhouse ID:', id);

        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid farmhouse ID' });
        }

        const farmhouse = await Farmhouse.findById(id);

        if (!farmhouse) {
            return res.status(404).json({ message: 'Farmhouse not found' });
        }

        if (farmhouse.approvalStatus !== 'pending') {
            return res.status(400).json({ 
                message: 'Farmhouse is not in pending status',
                currentStatus: farmhouse.approvalStatus
            });
        }

        // ✅ FIXED: Simple and clean update
        const updatedFarmhouse = await Farmhouse.findByIdAndUpdate(
          id,
          {
            approvalStatus: 'rejected',
            approvalDetails: {
              reviewedBy: req.userId,
              reviewedAt: new Date(),
              rejectionReason,
              notes: notes || '',
              action: 'rejected'
            },
            isActive: false
          },
          { 
            new: true, 
            runValidators: true 
          }
        ).populate('owner', 'name email phone');

        console.log('✅ Farmhouse rejected successfully');

        res.json({
            message: 'Farmhouse rejected successfully',
            farmhouse: updatedFarmhouse
        });
    } catch (error) {
        console.error('❌ REJECT FARMHOUSE ERROR:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid farmhouse ID' });
        }

        res.status(500).json({ 
            message: 'Server error while rejecting farmhouse', 
            error: error.message
        });
    }
}

// Legacy function - user's farmhouses
export const getUsersFarmhouse = async (req, res) => {
    try {
        const farmhouses = await Farmhouse.find({ owner: req.userId })
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(farmhouses);
    } catch (error) {
        console.error('Get my farmhouses error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
}

export const SearchFarmhouseByLocation = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const farmhouses = await Farmhouse.find({
            isActive: true,
            approvalStatus: 'approved',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radius * 1000
                }
            }
        }).populate('owner', 'name email phone');

        res.json(farmhouses);
    } catch (error) {
        console.error('Location search error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
}