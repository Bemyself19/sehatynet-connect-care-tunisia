import express from 'express';
import { getAllSettings, updateSettings } from '../controllers/systemSetting.controller';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roles';

const router = express.Router();

// Public endpoint for non-sensitive system settings (like paymentsEnabled)
router.get('/public', getAllSettings);

// Only authenticated admins can access and modify all system settings
router.get('/', authenticateJWT, authorizeRoles('admin'), getAllSettings);
router.put('/', authenticateJWT, authorizeRoles('admin'), updateSettings);

export default router; 