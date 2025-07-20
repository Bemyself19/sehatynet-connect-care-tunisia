import express from 'express';
import { getSpecialties, addSpecialty } from '../controllers/specialty.controller';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateJWT, getSpecialties);
router.post('/', authenticateJWT, addSpecialty);

export default router; 