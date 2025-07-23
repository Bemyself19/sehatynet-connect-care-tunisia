
import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { isDoctor } from '../middleware/roles';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  generatePrescriptionPdf,
  assignMedicationProvider,
  assignLabProvider,
  assignRadiologyProvider,
  fulfillMedicationItems,
  fulfillLabTestItems,
  fulfillRadiologyItems,
  setItemReadyForPickup,
  setItemCompleted,
  reassignPrescriptionItem
} from '../controllers/prescription.controller';

const router = express.Router();





// Patient reassigns provider for a medication, lab, or radiology item (if partial/rejected)
router.patch('/:id/reassign', authenticateJWT, reassignPrescriptionItem);

// Fulfillment endpoints
// PATCH /api/prescriptions/:id/medications/fulfillment
router.patch('/:id/medications/fulfillment', authenticateJWT, fulfillMedicationItems);
// PATCH /api/prescriptions/:id/lab-tests/fulfillment
router.patch('/:id/lab-tests/fulfillment', authenticateJWT, fulfillLabTestItems);
// PATCH /api/prescriptions/:id/radiology/fulfillment
router.patch('/:id/radiology/fulfillment', authenticateJWT, fulfillRadiologyItems);

// Assign provider to a medication item
router.post('/:id/assign-medication', authenticateJWT, assignMedicationProvider);

// Assign provider to a lab test item
router.post('/:id/assign-lab', authenticateJWT, assignLabProvider);

// Assign provider to a radiology exam item
router.post('/:id/assign-radiology', authenticateJWT, assignRadiologyProvider);

// @route   POST api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor)
router.post('/', [authenticateJWT, isDoctor], createPrescription);

// @route   GET api/prescriptions
// @desc    Get all prescriptions for the logged-in user (patient or provider)
// @access  Private
router.get('/', authenticateJWT, getPrescriptions);

// @route   GET api/prescriptions/:id
// @desc    Get a single prescription by its ID
// @access  Private
router.get('/:id', authenticateJWT, getPrescriptionById);

// @route   GET api/prescriptions/:id/pdf
// @desc    Download prescription as PDF
// @access  Private
router.get('/:id/pdf', authenticateJWT, generatePrescriptionPdf);

// Provider sets item as ready for pickup
router.patch('/:id/item/ready-for-pickup', authenticateJWT, setItemReadyForPickup);

// Provider marks item as completed (picked up by patient), generates transactionId
router.patch('/:id/item/complete', authenticateJWT, setItemCompleted);

export default router; 