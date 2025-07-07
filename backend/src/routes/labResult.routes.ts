import express from "express";
import { 
    createLabResult, 
    getLabResults, 
    getLabResultById, 
    updateLabResult, 
    verifyLabResult,
    getLabResultsByPatient,
    getCriticalLabResults
} from "../controllers/labResult.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Create lab result (doctors and lab technicians)
router.post("/", authorizeRoles("doctor", "lab"), createLabResult);

// Get lab results (filtered by role)
router.get("/", getLabResults);

// Get specific lab result
router.get("/:id", getLabResultById);

// Update lab result (doctors and lab technicians)
router.put("/:id", authorizeRoles("doctor", "lab"), updateLabResult);

// Verify lab result (doctors and lab technicians)
router.patch("/:id/verify", authorizeRoles("doctor", "lab"), verifyLabResult);

// Get lab results by patient
router.get("/patient/:patientId", getLabResultsByPatient);

// Get critical lab results (doctors, lab technicians, and admins)
router.get("/critical/all", authorizeRoles("doctor", "lab", "admin"), getCriticalLabResults);

export default router; 