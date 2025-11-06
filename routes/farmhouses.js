// import express from 'express';
// import { auth, ownerAuth } from '../middleware/auth.js';
// import {
//     getOwnerFarmhouses,
//     getAllFarmhouses,
//     getSinglefarmhouse,
//     CreateFarmhouse,
//     UpdateFarmhouse,
//     DeleteFarmhouse,
//     SearchFarmhouseByLocation
// } from '../controllers/farmhouses.controllers.js';

// const router = express.Router();

// // Owner-specific routes
// router.get('/owner/my-farmhouses', auth, getOwnerFarmhouses);
// router.post('/', auth, ownerAuth, CreateFarmhouse);
// router.put('/:id', auth, UpdateFarmhouse); // Use auth middleware, not ownerAuth
// router.delete('/:id', auth, DeleteFarmhouse); // Use auth middleware, not ownerAuth

// // Public routes
// router.get('/', getAllFarmhouses);
// router.get('/search/location', SearchFarmhouseByLocation);
// router.get('/:id', getSinglefarmhouse);

// export default router;


import express from 'express';
import { auth, ownerAuth, adminAuth } from '../middleware/auth.js';
import {
    getOwnerFarmhouses,
    getAllFarmhouses,
    getSinglefarmhouse,
    CreateFarmhouse,
    UpdateFarmhouse,
    DeleteFarmhouse,
    SearchFarmhouseByLocation,
    // ✅ ADDED: New approval functions
    getPendingFarmhouses,
    approveFarmhouse,
    rejectFarmhouse
} from '../controllers/farmhouses.controllers.js';

const router = express.Router();

// Owner-specific routes
router.get('/owner/my-farmhouses', auth, getOwnerFarmhouses);
router.post('/', auth, ownerAuth, CreateFarmhouse);
router.put('/:id', auth, UpdateFarmhouse);
router.delete('/:id', auth, DeleteFarmhouse);

// ✅ ADDED: Admin approval routes
router.get('/admin/pending', adminAuth, getPendingFarmhouses);
router.put('/admin/approve/:id', adminAuth, approveFarmhouse);
router.put('/admin/reject/:id', adminAuth, rejectFarmhouse);

// Public routes
router.get('/', getAllFarmhouses);
router.get('/search/location', SearchFarmhouseByLocation);
router.get('/:id', getSinglefarmhouse);

export default router;