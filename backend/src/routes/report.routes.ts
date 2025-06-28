import express from 'express';
import { getOverviewStats, getUserStats, getAppointmentStats, getSystemStats } from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roles';

const router = express.Router();

router.get('/overview', authenticateJWT, authorizeRoles('admin'), getOverviewStats);
router.get('/users', authenticateJWT, authorizeRoles('admin'), getUserStats);
router.get('/appointments', authenticateJWT, authorizeRoles('admin'), getAppointmentStats);
router.get('/system', authenticateJWT, authorizeRoles('admin'), getSystemStats);

export default router; 