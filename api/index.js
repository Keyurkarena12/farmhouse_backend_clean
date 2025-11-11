import app from './server.js';

// ✅ Vercel provides its own port automatically
const PORT = process.env.PORT || 3001;

// For local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// ✅ Export for Vercel
export default app;