import express from "express";
import { 
    createMedicationHistory, 
    getMedicationHistory, 
    getMedicationHistoryById, 
    updateMedicationHistory, 
    discontinueMedication,
    getCurrentMedications,
    getMedicationInteractions
} from "../controllers/medication.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Create medication history (doctors and pharmacists)
router.post("/", authorizeRoles("doctor", "pharmacy"), createMedicationHistory);

// Get medication history (filtered by role)
router.get("/", getMedicationHistory);

// Get specific medication history
router.get("/:id", getMedicationHistoryById);

// Update medication history (doctors and pharmacists)
router.put("/:id", authorizeRoles("doctor", "pharmacy"), updateMedicationHistory);

// Discontinue medication (doctors and pharmacists)
router.patch("/:id/discontinue", authorizeRoles("doctor", "pharmacy"), discontinueMedication);

// Get current medications by patient
router.get("/patient/:patientId/current", getCurrentMedications);

// Check medication interactions
router.get("/patient/:patientId/interactions", getMedicationInteractions);

export default router; 