// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import morgan from 'morgan';
// import cookieParser from 'cookie-parser';
// import authRoutes from '../routes/auth.js';
// import farmhouseRoutes from '../routes/farmhouses.js';
// import bookingRoutes from '../routes/bookings.js';
// import userRoutes from '../routes/users.js';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();

// // ✅ Enhanced CORS setup for Vercel deployment
// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL, 
//       'https://farmhouse-frontend-omega.vercel.app',
//       'http://localhost:3000',
//       'https://farmhouse-frontend.vercel.app'
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
//   })
// );

// // Handle preflight requests
// // app.options('*', cors());

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cookieParser());
// app.use(morgan('combined'));

// // ✅ MongoDB connection with better error handling
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('✅ Connected to MongoDB'))
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// // ✅ API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/farmhouses', farmhouseRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/users', userRoutes);

// // ✅ Enhanced health check
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ 
//     message: 'Farmhouse Booking API is running!',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ✅ Root endpoint
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'Farmhouse Booking API Server',
//     version: '1.0.0',
//     status: 'active'
//   });
// });

// // ✅ Enhanced error handling
// app.use((err, req, res, next) => {
//   console.error('🚨 Error Stack:', err.stack);
//   res.status(500).json({ 
//     message: 'Something went wrong!',
//     ...(process.env.NODE_ENV === 'development' && { error: err.message })
//   });
// });

// // ✅ FIXED: 404 handler - use proper wildcard syntax
// app.use((req, res) => {
//   res.status(404).json({ 
//     message: 'API route not found',
//     path: req.originalUrl,
//     method: req.method
//   });
// });

// // ✅ Important: export the app (not listen)
// export default app;


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.js';
import farmhouseRoutes from '../routes/farmhouses.js';
import bookingRoutes from '../routes/bookings.js';
import userRoutes from '../routes/users.js';
import dotenv from 'dotenv';


dotenv.config();

const app = express();



// ✅ Enhanced CORS setup for Vercel deployment
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      'https://farmhouse-frontend-omega.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://farmhouse-frontend.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Handle preflight requests
// app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined'));

// ✅ MongoDB connection with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/farmhouses', farmhouseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// ✅ Enhanced health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Farmhouse Booking API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Farmhouse Booking API Server',
    version: '1.0.0',
    status: 'active'
  });
});

// ✅ Enhanced error handling
app.use((err, req, res, next) => {
  console.error('🚨 Error Stack:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ✅ FIXED: 404 handler - use proper wildcard syntax
app.use((req, res) => {
  res.status(404).json({
    message: 'API route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Important: export the app (not listen)
export default app;


