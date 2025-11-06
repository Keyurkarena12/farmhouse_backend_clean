import express from 'express';
import Booking from '../models/Booking.js';
import Farmhouse from '../models/Farmhouse.js';
import { auth } from '../middleware/auth.js';
import { 
  CancelBooking, 
  createBooking, 
  getBlockedDates, 
  getFarmhouseReviews, 
  getOwnerBookings, 
  getOwnerRatings, 
  getUserBookings, 
  submitReview, 
  updateBlockedDates, 
  updateBooking,
  removeBookingFromList, 
  removeBookingFromOwnerList,
  getActiveBookingsCount,
  getAdminBookings
} from '../controllers/bookings.controllers.js';

const router = express.Router();

// Create booking
router.post('/', auth, createBooking);

// Get user's bookings
router.get('/my', auth, getUserBookings);

// Get single booking
// router.get('/:id', auth, getSingleBooking);

router.get('/owner', auth, getOwnerBookings);

// Update booking status
router.put('/:id/status', auth, updateBooking);

// Cancel booking
router.put('/:id/cancel', auth, CancelBooking);

// ✅ NEW: Remove booking from user's list
router.delete('/:id/remove-from-list', auth, removeBookingFromList);

// In your routes file
router.delete('/owner/:id/remove-from-list', auth, removeBookingFromOwnerList);

// Add this route to your existing routes
router.get('/owner/active-count', auth, getActiveBookingsCount);

// Check availability
// router.post('/check-availability',CheckBooking);

// Rating and review routes
router.post('/:id/review', auth, submitReview);
router.get('/farmhouse/:id/reviews', getFarmhouseReviews);
router.get('/owner/ratings', auth, getOwnerRatings);

// Blocked dates routes
router.get('/farmhouse/:id/blocked-dates', getBlockedDates);
router.put('/farmhouse/:id/blocked-dates', auth, updateBlockedDates);


router.get('/admin/all', auth, getAdminBookings);
export default router;