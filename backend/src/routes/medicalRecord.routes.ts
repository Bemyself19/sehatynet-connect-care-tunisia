import express from "express";
import multer from "multer";
import path from "path";
import { 
  createMedicalRecord, 
  getMedicalRecords, 
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPatientMedicalHistory,
  getDoctorNotesForPatient,
  getPatientDashboard,
  getAssignedRequests,
  updateRecordPrivacy,
  assignProviderToSection,
  uploadLabRadiologyReport,
  getMedicalRecordsByPrescriptionId,
  fulfillAssignedRequest
} from "../controllers/medicalRecord.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Create medical record (for doctors creating notes, etc.)
router.post("/", authenticateJWT, createMedicalRecord);

// Get patient dashboard with stats and recent data
router.get("/dashboard", authenticateJWT, getPatientDashboard);

// Upload medical record file (for patients)
router.post("/upload", authenticateJWT, authorizeRoles("patient"), upload.single("file"), createMedicalRecord);

// Get medical records for current user
router.get("/my", authenticateJWT, authorizeRoles("patient"), getMedicalRecords);

// Get all medical records (for doctors/admins)
router.get("/", authenticateJWT, getMedicalRecords);

// Get specific medical record by ID
// Get assigned requests (must be before /:id)
router.get("/assigned", authenticateJWT, getAssignedRequests);
router.get("/:id", authenticateJWT, getMedicalRecordById);

// Update medical record
router.put("/:id", authenticateJWT, updateMedicalRecord);

// Delete medical record
router.delete("/:id", authenticateJWT, deleteMedicalRecord);

// Get patient medical history
router.get("/patient/:patientId", authenticateJWT, getPatientMedicalHistory);

// Get doctor notes for a specific patient
router.get("/patient/:patientId/notes", authenticateJWT, getDoctorNotesForPatient);

// Update record privacy
router.patch("/:id/privacy", authenticateJWT, updateRecordPrivacy);

// Assign provider to medical record
router.post("/:id/assign-provider", authenticateJWT, assignProviderToSection);

// Fulfill assigned request (for providers)
router.patch("/:id/fulfill", authenticateJWT, fulfillAssignedRequest);

// Upload lab/radiology reports
router.post("/:id/upload-report", authenticateJWT, upload.single("file"), uploadLabRadiologyReport);

// Cancel a medical record request
import { cancelMedicalRecordRequest } from "../controllers/medicalRecord.controller";
router.patch("/:id/cancel", authenticateJWT, cancelMedicalRecordRequest);

// Get medical records by prescription ID
router.get("/by-prescription/:prescriptionId", authenticateJWT, getMedicalRecordsByPrescriptionId);

export default router;