// import mongoose from 'mongoose';

// const farmhouseSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Farmhouse name is required'],
//     trim: true,
//     maxlength: [100, 'Name cannot exceed 100 characters']
//   },
//   description: {
//     type: String,
//     required: [true, 'Description is required'],
//     maxlength: [1000, 'Description cannot exceed 1000 characters']
//   },
//   address: {
//     street: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     zipCode: { type: String, required: true },
//     country: { type: String, required: true, default: 'India' }
//   },
//   location: {
//     latitude: { type: Number, required: true },
//     longitude: { type: Number, required: true }
//   },
//   images: [{
//     url: { type: String, required: true },
//     alt: { type: String, default: '' },
//     isPrimary: { type: Boolean, default: false }
//   }],
//   amenities: [{
//     name: { type: String, required: true },
//     icon: { type: String, default: '' },
//     category: {
//       type: String,
//       enum: ['basic', 'comfort', 'luxury', 'outdoor', 'kitchen', 'bathroom'],
//       default: 'basic'
//     }
//   }],
//   rooms: [{
//     type: {
//       type: String,
//       enum: ['single', 'double', 'family', 'suite', 'villa'],
//       required: true
//     },
//     name: { type: String, required: true },
//     capacity: { type: Number, required: true, min: 1 },
//     pricePerNight: { type: Number, required: true, min: 0 },
//     description: String,
//     images: [String],
//     amenities: [String],
//     isAvailable: { type: Boolean, default: true }
//   }],
//   pricing: {
//     basePrice: { type: Number, required: true, min: 0 },
//     weekendMultiplier: { type: Number, default: 1.2 },
//     holidayMultiplier: { type: Number, default: 1.5 },
//     cleaningFee: { type: Number, default: 0 },
//     securityDeposit: { type: Number, default: 0 }
//   },
//   availability: {
//     checkInTime: { type: String, default: '15:00' },
//     checkOutTime: { type: String, default: '11:00' },
//     minimumStay: { type: Number, default: 1 },
//     maximumStay: { type: Number, default: 30 },
//     advanceBookingDays: { type: Number, default: 365 },
//     blockedDates: [{
//       date: { type: Date, required: true },
//       reason: { type: String, default: 'Owner blocked' },
//       blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//       blockedAt: { type: Date, default: Date.now }
//     }]
//   },
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   contact: {
//     phone: { type: String, required: true },
//     email: { type: String, required: true },
//     whatsapp: String
//   },
//   policies: {
//     cancellation: {
//       freeCancellation: { type: Boolean, default: true },
//       freeCancellationDays: { type: Number, default: 7 },
//       partialRefundDays: { type: Number, default: 3 }
//     },
//     houseRules: [String],
//     petPolicy: { type: String, default: 'Not allowed' },
//     smokingPolicy: { type: String, default: 'Not allowed' }
//   },
//   ratings: {
//     average: { type: Number, default: 0, min: 0, max: 5 },
//     count: { type: Number, default: 0 }
//   },
//   // ✅ ADDED: Approval system fields
//   approvalStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   approvalDetails: {
//     reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     reviewedAt: Date,
//     rejectionReason: String,
//     notes: String
//   },
//   isActive: { type: Boolean, default: true },
//   isVerified: { type: Boolean, default: false },
//   featured: { type: Boolean, default: false }
// }, {
//   timestamps: true
// });

// // Index for location-based searches
// farmhouseSchema.index({ location: '2dsphere' });

// // Index for text search
// farmhouseSchema.index({
//   name: 'text',
//   description: 'text',
//   'address.city': 'text',
//   'address.state': 'text'
// });

// // Index for approval status
// farmhouseSchema.index({ approvalStatus: 1 });
// farmhouseSchema.index({ owner: 1, approvalStatus: 1 });

// // ✅ ADD: Pre-save middleware to set approvalStatus for existing documents
// farmhouseSchema.pre('save', function(next) {
//   // If approvalStatus is not set (existing documents), set it to 'approved'
//   if (!this.approvalStatus) {
//     this.approvalStatus = 'approved';
//   }
//   next();
// });


// export default mongoose.model('Farmhouse', farmhouseSchema);

import mongoose from 'mongoose';

const farmhouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Farmhouse name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [{
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    category: {
      type: String,
      enum: ['basic', 'comfort', 'luxury', 'outdoor', 'kitchen', 'bathroom'],
      default: 'basic'
    }
  }],
  rooms: [{
    type: {
      type: String,
      enum: ['single', 'double', 'family', 'suite', 'villa'],
      required: true
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    description: String,
    images: [String],
    amenities: [String],
    isAvailable: { type: Boolean, default: true }
  }],
  pricing: {
    basePrice: { type: Number, required: true, min: 0 },
    weekendMultiplier: { type: Number, default: 1.2 },
    holidayMultiplier: { type: Number, default: 1.5 },
    cleaningFee: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 }
  },
  availability: {
    checkInTime: { type: String, default: '15:00' },
    checkOutTime: { type: String, default: '11:00' },
    minimumStay: { type: Number, default: 1 },
    maximumStay: { type: Number, default: 30 },
    advanceBookingDays: { type: Number, default: 365 },
    blockedDates: [{
      date: { type: Date, required: true },
      reason: { type: String, default: 'Owner blocked' },
      blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      blockedAt: { type: Date, default: Date.now }
    }]
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp: String
  },
  policies: {
    cancellation: {
      freeCancellation: { type: Boolean, default: true },
      freeCancellationDays: { type: Number, default: 7 },
      partialRefundDays: { type: Number, default: 3 }
    },
    houseRules: [String],
    petPolicy: { type: String, default: 'Not allowed' },
    smokingPolicy: { type: String, default: 'Not allowed' }
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  // ✅ FIXED: Better approval system
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalDetails: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    action: { type: String, enum: ['approved', 'rejected'] }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for location-based searches
farmhouseSchema.index({ location: '2dsphere' });

// Index for text search
farmhouseSchema.index({
  name: 'text',
  description: 'text',
  'address.city': 'text',
  'address.state': 'text'
});

// Index for approval status
farmhouseSchema.index({ approvalStatus: 1 });
farmhouseSchema.index({ owner: 1, approvalStatus: 1 });

export default mongoose.model('Farmhouse', farmhouseSchema);


 // availability: {
  //   checkInTime: { type: String, default: '15:00' },
  //   checkOutTime: { type: String, default: '11:00' },
  //   minimumStay: { type: Number, default: 1 },
  //   maximumStay: { type: Number, default: 30 },
  //   advanceBookingDays: { type: Number, default: 365 },
  //   blockedDates: [Date]
  // },