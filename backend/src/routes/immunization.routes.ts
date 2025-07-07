import express from "express";
import { 
    createImmunization, 
    getImmunizations, 
    getImmunizationById, 
    updateImmunization, 
    addDose,
    getOverdueImmunizations,
    getImmunizationSchedule
} from "../controllers/immunization.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Create immunization (doctors and lab technicians)
router.post("/", authorizeRoles("doctor", "lab"), createImmunization);

// Get immunizations (filtered by role)
router.get("/", getImmunizations);

// Get specific immunization
router.get("/:id", getImmunizationById);

// Update immunization (doctors and lab technicians)
router.put("/:id", authorizeRoles("doctor", "lab"), updateImmunization);

// Add dose to immunization (doctors and lab technicians)
router.post("/:id/doses", authorizeRoles("doctor", "lab"), addDose);

// Get overdue immunizations (doctors, lab technicians, and admins)
router.get("/overdue/all", authorizeRoles("doctor", "lab", "admin"), getOverdueImmunizations);

// Get immunization schedule for a patient
router.get("/patient/:patientId/schedule", getImmunizationSchedule);

export default router; 