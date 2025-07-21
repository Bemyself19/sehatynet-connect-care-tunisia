
import express from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditLog.controller';
import { authenticateJWT } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roles';

const router = express.Router();

// Get audit logs (admin only)
router.get('/', authenticateJWT, authorizeRoles('admin'), getAuditLogs);

// Create audit log (any authenticated user)
router.post('/', authenticateJWT, createAuditLog);

export default router;
