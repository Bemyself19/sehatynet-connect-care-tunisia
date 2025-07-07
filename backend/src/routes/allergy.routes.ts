import express from "express";
import { 
    createAllergy, 
    getAllergies, 
    getAllergyById, 
    updateAllergy, 
    confirmAllergy,
    resolveAllergy,
    getHighRiskAllergies,
    checkMedicationAllergies
} from "../controllers/allergy.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Create allergy (doctors and lab technicians)
router.post("/", authorizeRoles("doctor", "lab"), createAllergy);

// Get allergies (filtered by role)
router.get("/", getAllergies);

// Get specific allergy
router.get("/:id", getAllergyById);

// Update allergy (doctors and lab technicians)
router.put("/:id", authorizeRoles("doctor", "lab"), updateAllergy);

// Confirm allergy (doctors and lab technicians)
router.patch("/:id/confirm", authorizeRoles("doctor", "lab"), confirmAllergy);

// Resolve allergy (doctors only)
router.patch("/:id/resolve", authorizeRoles("doctor"), resolveAllergy);

// Get high risk allergies (doctors, pharmacists, lab technicians, and admins)
router.get("/high-risk/all", authorizeRoles("doctor", "pharmacy", "lab", "admin"), getHighRiskAllergies);

// Check medication allergies for a patient
router.get("/patient/:patientId/medication/:medicationName", checkMedicationAllergies);

export default router; 