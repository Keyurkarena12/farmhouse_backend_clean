import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmhouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmhouse',
    required: true
  },
  room: {
    type: {
      type: String,
      required: true
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true }
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 }
  },
  pricing: {
    basePrice: { type: Number, required: true },
    totalNights: { type: Number, required: true },
    roomPrice: { type: Number, required: true },
    farmhouseBasePrice: { type: Number, required: true, default: 0 }, // Farmhouse base price per night
    cleaningFee: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'rejected'],
    default: 'pending'
  },

  payment: {
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
      required: false // ✅ made optional
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },

  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: String
  },
  cancellation: {
    requestedAt: Date,
    reason: String,
    refundAmount: Number,
    status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected']
    }
  },
  checkInDetails: {
    actualCheckIn: Date,
    actualCheckOut: Date,
    checkedInBy: String,
    notes: String
  },

  hiddenFromUser: {
    type: Boolean,
    default: false
  },
  hiddenAt: {
    type: Date
  },
  hiddenFromOwner: {
    type: Boolean,
    default: false
  },
  hiddenFromOwnerAt: {
    type: Date
  },

  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5'
      }
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ farmhouse: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, checkIn: 1 });

// Virtual for booking duration
bookingSchema.virtual('duration').get(function () {
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate total nights
bookingSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    this.pricing.totalNights = Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);


// payment: {
//   method: {
//     type: String,
//     enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'completed', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   transactionId: String,
//   paymentId: String,
//   paidAt: Date,
//   refundedAt: Date,
//   refundAmount: Number
// },