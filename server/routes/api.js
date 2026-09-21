import express from 'express';
import {
  getComplaints,
  createComplaint,
  assignWorker,
  updateStatus,
  resolveComplaint,
  getWorkers,
  addWorker,
  deleteWorker,
  loginUser,
  registerUser,
  exportAdminData,
  getKanpurWards,
  getAllUsers
} from '../controllers/complaintController.js';

const router = express.Router();

// Health Check Route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CleanCity AI Backend API route is healthy and running',
    timestamp: new Date().toISOString()
  });
});
// Auth routes
router.post('/auth/login', loginUser);
router.post('/auth/register', registerUser);

// Complaints routes
router.get('/complaints', getComplaints);
router.post('/complaints', createComplaint);
router.patch('/complaints/:ticketId/assign', assignWorker);
router.patch('/complaints/:ticketId/status', updateStatus);
router.patch('/complaints/:ticketId/resolve', resolveComplaint);

// Worker staff management (Admin Only)
router.get('/workers', getWorkers);
router.post('/workers', addWorker);
router.delete('/workers/:workerId', deleteWorker);

// Admin Data & User Audit
router.get('/admin/users', getAllUsers);
router.get('/kanpur/wards', getKanpurWards);
router.get('/admin/export', exportAdminData);

export default router;
