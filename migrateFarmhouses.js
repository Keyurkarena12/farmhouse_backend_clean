import mongoose from 'mongoose';
import Farmhouse from './models/Farmhouse.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateFarmhouses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmhouse-booking');
    console.log('Connected to MongoDB');

    // Update all existing farmhouses to have approvalStatus: 'approved'
    const result = await Farmhouse.updateMany(
      { approvalStatus: { $exists: false } }, // Find documents without approvalStatus
      { $set: { approvalStatus: 'approved' } } // Set approvalStatus to approved
    );

    console.log(`✅ Migration completed: ${result.modifiedCount} farmhouses updated to approved status`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateFarmhouses();