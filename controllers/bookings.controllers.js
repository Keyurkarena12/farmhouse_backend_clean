import express from 'express';
import Booking from '../models/Booking.js';
import Farmhouse from '../models/Farmhouse.js';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js'; // ✅ Ensure this import exists

const checkBlockedDates = (farmhouse, checkIn, checkOut) => {
  const blockedDates = farmhouse.availability?.blockedDates || [];
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Get all dates between check-in and check-out
  const datesInRange = [];
  const currentDate = new Date(checkInDate);

  while (currentDate < checkOutDate) {
    datesInRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Check if any date in range is blocked
  for (const date of datesInRange) {
    const isBlocked = blockedDates.some(blocked => {
      const blockedDate = new Date(blocked.date);
      return blockedDate.toDateString() === date.toDateString();
    });

    if (isBlocked) {
      return {
        available: false,
        blockedDate: date.toISOString().split('T')[0]
      };
    }
  }

  return { available: true };
};

export const createBooking = async (req, res) => {
  try {
    const {
      farmhouseId,
      roomType,
      checkIn,
      checkOut,
      guests,
      specialRequests,
      contactInfo
    } = req.body;

    console.log('Booking request:', { farmhouseId, roomType, checkIn, checkOut, guests });
    console.log('User making booking:', { userId: req.userId, user: req.user });

    // ✅ FIX: Get user data from database
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate farmhouse exists
    const farmhouse = await Farmhouse.findById(farmhouseId);
    if (!farmhouse) {
      return res.status(404).json({ message: 'Farmhouse not found' });
    }

    console.log('Farmhouse owner:', farmhouse.owner);
    console.log('Current user:', req.userId);

    // ✅ NEW: Check for blocked dates
    const blockedCheck = checkBlockedDates(farmhouse, checkIn, checkOut);
    if (!blockedCheck.available) {
      return res.status(400).json({ 
        message: `Selected dates include blocked date: ${blockedCheck.blockedDate}. Please choose different dates.` 
      });
    }

    // Find the room type
    const room = farmhouse.rooms.find(r =>
      r.type === roomType ||
      r.type?.toLowerCase() === roomType?.toLowerCase() ||
      r.name?.toLowerCase().includes(roomType?.toLowerCase())
    );

    if (!room) {
      return res.status(400).json({
        message: `Room type '${roomType}' not available. Available rooms: ${farmhouse.rooms.map(r => r.type).join(', ')}`
      });
    }

    // Check availability
    const existingBookings = await Booking.find({
      farmhouse: farmhouseId,
      'room.type': roomType,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) }
        }
      ]
    });

    console.log('Existing bookings:', existingBookings.length);

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Selected room type not available for the chosen dates' });
    }

    // Calculate pricing
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // ✅ FIX: Include farmhouse base price in calculations
    const roomPrice = room.pricePerNight * totalNights;
    const farmhouseBasePrice = farmhouse.pricing?.basePrice || 0;
    const basePrice = roomPrice + (farmhouseBasePrice * totalNights); // Add farmhouse base price

    const cleaningFee = farmhouse.pricing?.cleaningFee || 0;
    const securityDeposit = farmhouse.pricing?.securityDeposit || 0;
    const taxes = (basePrice + cleaningFee) * 0.18; // 18% GST
    const totalAmount = basePrice + cleaningFee + securityDeposit + taxes;

    console.log('💰 Pricing breakdown:', {
      roomPricePerNight: room.pricePerNight,
      farmhouseBasePrice: farmhouseBasePrice,
      totalNights,
      roomPrice,
      farmhouseBaseTotal: farmhouseBasePrice * totalNights,
      basePrice,
      cleaningFee,
      securityDeposit,
      taxes,
      totalAmount
    });

    // ✅ FIX: Create booking with proper user data
    const booking = new Booking({
      user: req.userId,
      farmhouse: farmhouseId,
      room: {
        type: roomType,
        name: room.name,
        capacity: room.capacity
      },
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      pricing: {
        basePrice,
        totalNights,
        roomPrice: roomPrice, // Store room price separately
        farmhouseBasePrice: farmhouseBasePrice, // Store farmhouse base price
        cleaningFee,
        securityDeposit,
        taxes,
        totalAmount
      },
      specialRequests,
      contactInfo: {
        name: contactInfo?.name || user.name,
        email: contactInfo?.email || user.email,
        phone: contactInfo?.phone || user.phone
      },
      status: 'pending' // ✅ Explicitly set status
    });

    booking.payment = { status: 'pending' };

    await booking.save();

    // ✅ FIX: Better population
    await booking.populate('user', 'name email');
    await booking.populate({
      path: 'farmhouse',
      select: 'name address images owner pricing'
    });

    console.log('✅ Booking created successfully:', {
      bookingId: booking._id,
      farmhouseId: booking.farmhouse._id,
      farmhouseOwner: booking.farmhouse.owner,
      bookingUser: booking.user._id,
      bookingStatus: booking.status,
      totalAmount: booking.pricing.totalAmount
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    console.log('🔍 Fetching bookings for user:', req.userId); // Debug log

    const filter = { 
      user: req.userId,
      hiddenFromUser: { $ne: true } // ✅ Ensure this is working correctly
    };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('farmhouse', 'name address images ratings')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    console.log(`✅ Found ${bookings.length} bookings for user ${req.userId}`); // Debug log
    console.log('📋 Booking statuses:', bookings.map(b => ({ id: b._id, status: b.status, hidden: b.hiddenFromUser })));

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Get my bookings error:', error);
    res.status(500).json({
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const CancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Calculate refund based on cancellation policy
    const farmhouse = await Farmhouse.findById(booking.farmhouse);
    const daysUntilCheckIn = Math.ceil((booking.checkIn - new Date()) / (1000 * 60 * 60 * 24));

    let refundAmount = 0;
    if (daysUntilCheckIn >= farmhouse.policies.cancellation.freeCancellationDays) {
      refundAmount = booking.pricing.totalAmount;
    } else if (daysUntilCheckIn >= farmhouse.policies.cancellation.partialRefundDays) {
      refundAmount = booking.pricing.totalAmount * 0.5;
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      requestedAt: new Date(),
      reason,
      refundAmount,
      status: 'approved'
    };

    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      refundAmount
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const getOwnerBookings = async (req, res) => {
  try {
    console.log('=== START getOwnerBookings ===');
    console.log('User ID:', req.userId);
    console.log('User role:', req.user?.role);

    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Step 1: Find farmhouses owned by this user
    const ownerFarmhouses = await Farmhouse.find({ owner: req.userId }).select('_id name');
    console.log('Owner farmhouses found:', ownerFarmhouses);

    if (!ownerFarmhouses?.length) {
      console.log('No farmhouses found for this owner');
      return res.status(200).json([]);
    }

    const farmhouseIds = ownerFarmhouses.map(f => f._id);
    console.log('Farmhouse IDs to search:', farmhouseIds);

    // Step 2: Find ALL bookings for these farmhouses
    const bookings = await Booking.find({
      farmhouse: { $in: farmhouseIds },
      hiddenFromOwner: { $ne: true }
    })
      .populate('user', 'name email phone')
      .populate('farmhouse', 'name images owner')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Raw bookings found: ${bookings.length}`);

    // Enhanced debugging
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        status: booking.status,
        farmhouseId: booking.farmhouse?._id,
        farmhouseName: booking.farmhouse?.name,
        farmhouseOwner: booking.farmhouse?.owner,
        userName: booking.user?.name,
        checkIn: booking.checkIn,
        createdAt: booking.createdAt
      });
    });

    res.status(200).json(bookings);
    console.log('=== END getOwnerBookings ===');
  } catch (error) {
    console.error('=== CRITICAL ERROR in getOwnerBookings ===');
    console.error('Error message:', error.message);
    console.error(error.stack);
    console.error('=== END ERROR ===');

    res.status(500).json({
      message: 'Internal server error while fetching owner bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Get active bookings count for owner
export const getActiveBookingsCount = async (req, res) => {
  try {
    console.log('=== START getActiveBookingsCount ===');
    console.log('User ID:', req.userId);

    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Step 1: Find farmhouses owned by this user
    const ownerFarmhouses = await Farmhouse.find({ owner: req.userId }).select('_id');
    console.log('Owner farmhouses found:', ownerFarmhouses.length);

    if (!ownerFarmhouses?.length) {
      return res.status(200).json({ count: 0 });
    }

    const farmhouseIds = ownerFarmhouses.map(f => f._id);

    // Step 2: Count active bookings (pending and confirmed)
    const activeBookingsCount = await Booking.countDocuments({
      farmhouse: { $in: farmhouseIds },
      status: { $in: ['pending', 'confirmed'] },
      hiddenFromOwner: { $ne: true }
    });

    console.log(`📊 Active bookings count: ${activeBookingsCount}`);

    res.status(200).json({ 
      count: activeBookingsCount 
    });

    console.log('=== END getActiveBookingsCount ===');
  } catch (error) {
    console.error('=== ERROR in getActiveBookingsCount ===');
    console.error('Error message:', error.message);
    res.status(500).json({
      message: 'Internal server error while fetching active bookings count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Remove booking from user's list (soft delete)
export const removeBookingFromList = async (req, res) => {
  try {
    const bookingId = req.params.id;

    console.log('Remove booking request:', { bookingId, userId: req.userId });

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking belongs to the user
    if (booking.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove this booking' });
    }

    // ✅ FIX: Allow removal for completed, rejected, AND cancelled bookings
    const allowedStatuses = ['completed', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Can only remove completed, rejected, or cancelled bookings from list' 
      });
    }

    console.log('Before update - hiddenFromUser:', booking.hiddenFromUser);

    // Soft delete: Add a flag to hide from user's list
    booking.hiddenFromUser = true;
    booking.hiddenAt = new Date();
    
    // Save and verify the update
    const updatedBooking = await booking.save();
    
    console.log('After update - hiddenFromUser:', updatedBooking.hiddenFromUser);
    console.log('Save result:', updatedBooking);

    // Verify the booking was updated in database
    const verifiedBooking = await Booking.findById(bookingId);
    console.log('Database verification - hiddenFromUser:', verifiedBooking.hiddenFromUser);

    console.log('✅ Booking removed from user list:', {
      bookingId: booking._id,
      status: booking.status,
      hiddenFromUser: verifiedBooking.hiddenFromUser
    });

    res.json({ 
      message: 'Booking removed from list successfully',
      bookingId: booking._id 
    });

  } catch (error) {
    console.error('Remove booking error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// ✅ FIXED: Remove booking from owner's list (soft delete)
export const removeBookingFromOwnerList = async (req, res) => {
  try {
    const bookingId = req.params.id;

    console.log('Remove booking from owner request:', { bookingId, ownerId: req.userId });

    // ✅ FIX: Populate 'farmhouse' instead of 'property'
    const booking = await Booking.findById(bookingId).populate('farmhouse', 'owner name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking farmhouse owner:', booking.farmhouse?.owner);
    console.log('Current user:', req.userId);

    // ✅ FIX: Check if the current user is the owner of the farmhouse
    if (booking.farmhouse.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove this booking as owner' });
    }

    // ✅ FIX: Allow removal for completed, rejected, AND cancelled bookings
    const allowedStatuses = ['completed', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Can only remove completed, rejected, or cancelled bookings from owner list' 
      });
    }

    console.log('Before owner update - hiddenFromOwner:', booking.hiddenFromOwner);

    // Soft delete: Add a flag to hide from owner's list
    booking.hiddenFromOwner = true;
    booking.hiddenFromOwnerAt = new Date();
    
    const updatedBooking = await booking.save();
    
    console.log('After owner update - hiddenFromOwner:', updatedBooking.hiddenFromOwner);

    // Verify the booking was updated in database
    const verifiedBooking = await Booking.findById(bookingId);
    console.log('Database verification - hiddenFromOwner:', verifiedBooking.hiddenFromOwner);

    console.log('✅ Booking removed from owner list:', {
      bookingId: booking._id,
      status: booking.status,
      hiddenFromOwner: verifiedBooking.hiddenFromOwner
    });

    res.json({ 
      message: 'Booking removed from owner list successfully',
      bookingId: booking._id 
    });

  } catch (error) {
    console.error('Remove booking from owner error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// ✅ FIX: Improved updateBooking function for owner management
export const updateBooking = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const bookingId = req.params.id;

    console.log('Update booking request:', { bookingId, status, reason, userId: req.userId });

    const booking = await Booking.findById(bookingId)
      .populate('farmhouse', 'owner name pricing');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking details:', {
      farmhouseOwner: booking.farmhouse.owner,
      currentUser: req.userId,
      bookingStatus: booking.status
    });

    // ✅ FIX: Ensure pricing structure exists
    if (!booking.pricing) {
      booking.pricing = {};
    }

    // ✅ FIX: Ensure farmhouseBasePrice exists
    if (booking.pricing.farmhouseBasePrice === undefined || booking.pricing.farmhouseBasePrice === null) {
      booking.pricing.farmhouseBasePrice = booking.farmhouse.pricing?.basePrice || 0;
    }

    // Authorization check
    const isFarmhouseOwner = booking.farmhouse.owner.toString() === req.userId.toString();
    const isAdmin = req.user?.role === 'admin';
    const isBookingOwner = booking.user.toString() === req.userId.toString();

    console.log('Authorization check:', { isFarmhouseOwner, isAdmin, isBookingOwner });

    if (!isFarmhouseOwner && !isAdmin && !isBookingOwner) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Handle status updates
    if (isFarmhouseOwner || isAdmin) {
      booking.status = status;

      // Handle payment status when confirming booking
      if (status === 'confirmed') {
        booking.payment = booking.payment || {};
        booking.payment.status = 'completed';
        booking.payment.paidAt = new Date();
      }

      // Handle rejection by owner
      if (status === 'rejected') {
        booking.cancellation = {
          requestedAt: new Date(),
          reason: reason || 'Booking rejected by farmhouse owner',
          refundAmount: booking.pricing.totalAmount,
          cancelledBy: 'owner',
          status: 'approved'
        };
        if (booking.payment) {
          booking.payment.status = 'refunded';
          booking.payment.refundedAt = new Date();
          booking.payment.refundAmount = booking.pricing.totalAmount;
        }
      }

      // Handle cancellation by owner
      if (status === 'cancelled' && (isFarmhouseOwner || isAdmin)) {
        booking.cancellation = {
          requestedAt: new Date(),
          reason: reason || 'Cancelled by farmhouse owner',
          refundAmount: 0,
          cancelledBy: 'owner',
          status: 'approved'
        };
      }
    } else if (isBookingOwner) {
      // Regular users can only cancel their own bookings
      if (status === 'cancelled') {
        booking.status = 'cancelled';
        booking.cancellation = {
          requestedAt: new Date(),
          reason: reason || 'Cancelled by user',
          refundAmount: booking.pricing.totalAmount,
          cancelledBy: 'user',
          status: 'approved'
        };
      } else {
        return res.status(403).json({ message: 'You can only cancel your own bookings' });
      }
    }

    // ✅ FIX: Save the booking with proper error handling
    try {
      await booking.save();
    } catch (saveError) {
      console.error('Save booking error:', saveError);
      // If it's a validation error, handle missing fields
      if (saveError.name === 'ValidationError') {
        for (const field in saveError.errors) {
          if (field === 'pricing.farmhouseBasePrice') {
            booking.pricing.farmhouseBasePrice = 0;
          }
        }
        // Try saving again
        await booking.save();
      } else {
        throw saveError;
      }
    }

    // Populate before sending response
    await booking.populate('user', 'name email');
    await booking.populate('farmhouse', 'name images owner pricing');

    console.log('✅ Booking updated successfully:', {
      bookingId: booking._id,
      newStatus: booking.status,
      farmhouseBasePrice: booking.pricing.farmhouseBasePrice
    });

    res.json({
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
}

// ✅ User submits a rating and review
export const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    console.log('Submit review request:', { bookingId, rating, comment, userId: req.userId });

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('farmhouse', 'owner name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed bookings' });
    }

    // Check if review already exists
    if (booking.review && booking.review.rating) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update booking with review
    booking.review = {
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date(),
      isVisible: true
    };

    await booking.save();

    // Update farmhouse average rating
    await updateFarmhouseRating(booking.farmhouse._id);

    // Populate before sending response
    await booking.populate('user', 'name email');
    await booking.populate('farmhouse', 'name images owner');

    console.log('✅ Review submitted successfully:', {
      bookingId: booking._id,
      rating: booking.review.rating,
      farmhouseId: booking.farmhouse._id
    });

    res.json({
      message: 'Review submitted successfully',
      review: booking.review
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
}

// ✅ Helper function to update farmhouse average rating
const updateFarmhouseRating = async (farmhouseId) => {
  try {
    // Get all completed bookings with reviews for this farmhouse
    const bookingsWithReviews = await Booking.find({
      farmhouse: farmhouseId,
      status: 'completed',
      'review.rating': { $exists: true, $ne: null }
    });

    if (bookingsWithReviews.length === 0) {
      // No reviews yet, set default values
      await Farmhouse.findByIdAndUpdate(farmhouseId, {
        'ratings.average': 0,
        'ratings.count': 0
      });
      return;
    }

    // Calculate average rating
    const totalRating = bookingsWithReviews.reduce((sum, booking) => {
      return sum + booking.review.rating;
    }, 0);

    const averageRating = totalRating / bookingsWithReviews.length;
    const roundedAverage = Math.round(averageRating * 10) / 10; // Round to 1 decimal

    // Update farmhouse
    await Farmhouse.findByIdAndUpdate(farmhouseId, {
      'ratings.average': roundedAverage,
      'ratings.count': bookingsWithReviews.length
    });

    console.log('✅ Farmhouse rating updated:', {
      farmhouseId,
      averageRating: roundedAverage,
      reviewCount: bookingsWithReviews.length
    });

  } catch (error) {
    console.error('Update farmhouse rating error:', error);
  }
}

// ✅ Get reviews for a farmhouse (public)
export const getFarmhouseReviews = async (req, res) => {
  try {
    const farmhouseId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Booking.find({
      farmhouse: farmhouseId,
      status: 'completed',
      'review.rating': { $exists: true, $ne: null },
      'review.isVisible': true
    })
      .populate('user', 'name')
      .select('checkIn checkOut review')
      .sort({ 'review.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      farmhouse: farmhouseId,
      status: 'completed',
      'review.rating': { $exists: true, $ne: null },
      'review.isVisible': true
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get farmhouse reviews error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
}

export const getOwnerRatings = async (req, res) => {
  try {
    console.log('=== START getOwnerRatings ===');
    console.log('User ID:', req.userId);

    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Step 1: Find farmhouses owned by this user
    const ownerFarmhouses = await Farmhouse.find({ owner: req.userId }).select('_id name ratings');
    console.log('Owner farmhouses found:', ownerFarmhouses);

    if (!ownerFarmhouses?.length) {
      return res.status(200).json({ farmhouses: [], totalReviews: 0, averageRating: 0 });
    }

    const farmhouseIds = ownerFarmhouses.map(f => f._id);

    // Step 2: Get all reviews for these farmhouses - USER KO PROPERLY POPULATE KARO
    const reviews = await Booking.find({
      farmhouse: { $in: farmhouseIds },
      status: 'completed',
      'review.rating': { $exists: true, $ne: null },
      'review.isVisible': true
    })
      .populate({
        path: 'user',
        select: 'name avatar profilePicture images profileImage photo'
      })
      .populate('farmhouse', 'name')
      .select('checkIn checkOut review farmhouse user') // USER BHI SELECT KARO
      .sort({ 'review.createdAt': -1 })
      .lean();

    console.log(`📊 Reviews found: ${reviews.length}`);
    
    // Debugging: Check karo kya data aa raha hai
    reviews.forEach((review, index) => {
      console.log(`Review ${index + 1} User Data:`, {
        userName: review.user?.name,
        avatar: review.user?.avatar,
        profilePicture: review.user?.profilePicture,
        images: review.user?.images,
        profileImage: review.user?.profileImage,
        photo: review.user?.photo
      });
    });

    // Calculate overall stats
    const totalReviews = reviews.length;
    const overallAverage = ownerFarmhouses.reduce((sum, f) => sum + (f.ratings.average || 0), 0) / ownerFarmhouses.length;
    const roundedOverall = Math.round(overallAverage * 10) / 10;

    res.status(200).json({
      farmhouses: ownerFarmhouses,
      recentReviews: reviews.slice(0, 10), // 10 reviews tak dikhao
      totalReviews,
      overallRating: roundedOverall || 0
    });

    console.log('=== END getOwnerRatings ===');
  } catch (error) {
    console.error('=== ERROR in getOwnerRatings ===');
    console.error('Error message:', error.message);
    res.status(500).json({
      message: 'Internal server error while fetching owner ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ✅ Get blocked dates for a farmhouse
export const getBlockedDates = async (req, res) => {
  try {
    const farmhouse = await Farmhouse.findById(req.params.id).select('availability.blockedDates');
    
    if (!farmhouse) {
      return res.status(404).json({ message: 'Farmhouse not found' });
    }

    const blockedDates = farmhouse.availability?.blockedDates?.map(blocked => ({
      date: blocked.date,
      reason: blocked.reason
    })) || [];

    res.json({ blockedDates });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// ✅ Block/unblock dates (Owner only)
export const updateBlockedDates = async (req, res) => {
  try {
    const { dates, action } = req.body; // action: 'block' or 'unblock'
    const farmhouseId = req.params.id;

    console.log('Update blocked dates:', { farmhouseId, dates, action, userId: req.userId });

    const farmhouse = await Farmhouse.findById(farmhouseId);
    
    if (!farmhouse) {
      return res.status(404).json({ message: 'Farmhouse not found' });
    }

    // Check if user owns this farmhouse
    if (farmhouse.owner.toString() !== req.userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage dates for this farmhouse' });
    }

    if (!farmhouse.availability) {
      farmhouse.availability = {};
    }
    if (!farmhouse.availability.blockedDates) {
      farmhouse.availability.blockedDates = [];
    }

    if (action === 'block') {
      // Add dates to blocked dates
      dates.forEach(date => {
        const dateObj = new Date(date);
        const alreadyBlocked = farmhouse.availability.blockedDates.some(blocked => 
          new Date(blocked.date).toDateString() === dateObj.toDateString()
        );
        
        if (!alreadyBlocked) {
          farmhouse.availability.blockedDates.push({
            date: dateObj,
            reason: 'Blocked by owner',
            blockedBy: req.userId,
            blockedAt: new Date()
          });
        }
      });
    } else if (action === 'unblock') {
      // Remove dates from blocked dates
      dates.forEach(date => {
        const dateObj = new Date(date);
        farmhouse.availability.blockedDates = farmhouse.availability.blockedDates.filter(
          blocked => new Date(blocked.date).toDateString() !== dateObj.toDateString()
        );
      });
    }

    await farmhouse.save();

    res.json({
      message: `Dates ${action}ed successfully`,
      blockedDates: farmhouse.availability.blockedDates
    });

  } catch (error) {
    console.error('Update blocked dates error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};



// bookings.Controllers.js - Add this function
export const getAdminBookings = async (req, res) => {
  try {
    console.log('=== Fetching ALL bookings for admin ===');
    
    // ✅ FIX: Correct admin check
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get ALL bookings with proper population
    const bookings = await Booking.find({})
      .populate('user', 'name email phone') // ✅ Ensure phone is populated
      .populate('farmhouse', 'name images address')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Total bookings found: ${bookings.length}`);
    
    // Debug: Check contact info
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1} Contact Info:`, {
        contactPhone: booking.contactInfo?.phone,
        userPhone: booking.user?.phone,
        userName: booking.user?.name
      });
    });

    res.status(200).json(bookings);
    
  } catch (error) {
    console.error('❌ Get admin bookings error:', error);
    res.status(500).json({
      message: 'Internal server error while fetching admin bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};