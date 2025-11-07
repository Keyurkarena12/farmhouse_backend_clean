// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import morgan from 'morgan';
// import cookieParser from 'cookie-parser';
// import authRoutes from './routes/auth.js';
// import farmhouseRoutes from './routes/farmhouses.js';
// import bookingRoutes from './routes/bookings.js';
// import userRoutes from './routes/users.js';

// dotenv.config();

// const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow your frontend
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(morgan('combined'));
// app.use('/uploads', express.static('uploads'));


// mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farmhouse_booking', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// app.use('/api/auth', authRoutes);
// app.use('/api/farmhouses', farmhouseRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/users', userRoutes);

// app.get('/api/health', (req, res) => {
//   res.json({ message: 'Farmhouse Booking API is running!' });
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: 'Something went wrong!' });
// });

// app.use((req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import farmhouseRoutes from './routes/farmhouses.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmhouses', farmhouseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Farmhouse Booking API is running!' });
});

// Error handlers
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ❌ REMOVE app.listen()
// ✅ Instead, export the Express app (Vercel will handle it)
export default app;
