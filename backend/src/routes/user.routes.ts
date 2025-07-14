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
    getProvidersByType
} from "../controllers/user.controller";
import { updateMedicalRecordConsent } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import User from "../models/user.model";

const router = express.Router();

// Test route (no authentication required)
router.get("/test", testUsers);

// Temporary development route to clear users
router.delete("/dev/clear-all", async (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        try {
            await User.deleteMany({});
            res.status(200).json({ message: 'All users have been deleted.' });
        } catch (err) {
            res.status(500).json({ message: 'Failed to clear users.' });
        }
    } else {
        res.status(403).json({ message: 'This action is forbidden in production.' });
    }
});

// Profile routes for the authenticated user. Using /me is a robust, stateless pattern.
router.get("/me", authenticateJWT, getProfile);
router.put("/me", authenticateJWT, updateProfile);
router.put("/me/consent", authenticateJWT, updateMedicalRecordConsent);

// Admin-only routes for user management
router.get("/", authenticateJWT, authorizeRoles('admin'), getAllUsers);
router.get("/stats", authenticateJWT, authorizeRoles('admin', 'doctor'), getDashboardStats);
router.put("/:id/status", authenticateJWT, authorizeRoles('admin'), updateUserStatus);
router.delete("/:id", authenticateJWT, authorizeRoles('admin'), deleteUser);

// Routes to get different types of users (e.g., for selection lists)
router.get("/providers", authenticateJWT, getProviders);
router.get("/providers/by-type", authenticateJWT, getProvidersByType);
router.get("/patients", authenticateJWT, getPatients);

// This route MUST be last to avoid capturing other specific routes
router.get("/:id", authenticateJWT, getUserById);

export default router;
