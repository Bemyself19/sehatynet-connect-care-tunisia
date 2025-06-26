import express from 'express';
import { createTeleExpertiseRequest, getTeleExpertiseRequests, updateTeleExpertiseRequest, uploadReportMiddleware, uploadReportHandler, uploadPatientFileMiddleware, uploadPatientFileHandler } from '../controllers/teleExpertiseRequest.controller';
import { authenticateJWT } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

function asyncHandler(fn: any) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get('/', authenticateJWT, getTeleExpertiseRequests);
router.post('/', authenticateJWT, createTeleExpertiseRequest);
router.put('/:id', authenticateJWT, asyncHandler(updateTeleExpertiseRequest));
router.post('/:id/report', authenticateJWT, uploadReportMiddleware, uploadReportHandler);
router.post('/:id/patient-file', authenticateJWT, uploadPatientFileMiddleware, uploadPatientFileHandler);

export default router; 