


import express from "express";
import {
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    getProviders,
    getPatients,
    getDashboardStats,
    testUsers,
    getProvidersByType,
    searchProvidersByRole
} from "../controllers/user.controller";
import { updateMedicalRecordConsent } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import User from "../models/user.model";

const router = express.Router();

// Generic providers route for API compatibility (e.g., /api/providers?role=doctor)
router.get("/providers", authenticateJWT, getProviders);

// Test route (no authentication required)
router.get("/test", testUsers);


// Provider search by role (pharmacy, lab, radiologist)
router.get("/providers/search", authenticateJWT, getProviders);

// Provider search by type (pharmacy, lab, radiologist) for compatibility
router.get("/providers/by-type", authenticateJWT, getProvidersByType);


// Patients list for doctors (and admins)
router.get("/patients", authenticateJWT, getPatients);

// Profile routes for the authenticated user. Using /me is a robust, stateless pattern.
router.get("/me", authenticateJWT, getProfile);
router.put("/me", authenticateJWT, updateProfile);
router.put("/me/consent", authenticateJWT, updateMedicalRecordConsent);
router.delete("/me", authenticateJWT, require("../controllers/user.controller").deleteOwnAccount);

// Admin-only routes for user management
router.get("/", authenticateJWT, authorizeRoles('admin'), getAllUsers);
router.get("/stats", authenticateJWT, authorizeRoles('admin', 'doctor'), getDashboardStats);
router.put("/:id/status", authenticateJWT, authorizeRoles('admin'), updateUserStatus);
router.delete("/:id", authenticateJWT, authorizeRoles('admin'), deleteUser);

module.exports = router;// ...existing code...
