import express from 'express';
import { createPrescription, getPrescriptions, getPrescriptionById, generatePrescriptionPdf } from '../controllers/prescription.controller';
import { authenticateJWT } from '../middleware/auth';
import { isDoctor } from '../middleware/roles';

const router = express.Router();

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

export default router; 