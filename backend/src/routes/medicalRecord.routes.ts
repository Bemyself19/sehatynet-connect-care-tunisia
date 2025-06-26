import express from "express";
import { 
    createMedicalRecord, 
    getMedicalRecords, 
    getMedicalRecordById, 
    updateMedicalRecord, 
    deleteMedicalRecord, 
    getPatientMedicalHistory,
    getPatientDashboard,
    updateRecordPrivacy,
    getDoctorNotesForPatient,
    assignProviderToSection,
    getMedicalRecordsByPrescriptionId,
    getAssignedRequests,
    fulfillAssignedRequest,
    cancelMedicalRecordRequest,
    reassignPharmacyForMedicalRecord,
    uploadLabRadiologyReport
} from "../controllers/medicalRecord.controller";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Medical record management
router.post("/", createMedicalRecord);
router.get("/", getMedicalRecords);
router.get("/patient/:patientId", getPatientMedicalHistory);
router.get("/dashboard", getPatientDashboard);
router.get("/assigned", getAssignedRequests);
router.get("/:id", getMedicalRecordById);
router.put("/:id", updateMedicalRecord);
router.patch("/:id/privacy", updateRecordPrivacy);
router.delete("/:id", deleteMedicalRecord);
router.get("/patient/:patientId/notes", getDoctorNotesForPatient);
router.post("/:id/assign-provider", assignProviderToSection);
router.get("/by-prescription/:prescriptionId", getMedicalRecordsByPrescriptionId);
router.patch("/:id/fulfill", fulfillAssignedRequest);
router.patch("/:id/cancel", cancelMedicalRecordRequest);
router.post("/:id/reassign-pharmacy", reassignPharmacyForMedicalRecord);
router.post('/:id/upload-report', uploadLabRadiologyReport);

export default router; 