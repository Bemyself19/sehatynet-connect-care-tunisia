import express from "express";
import { 
    createAppointment, 
    getAppointments, 
    getAppointmentById, 
    updateAppointment, 
    cancelAppointment, 
    getAvailableSlots, 
    getAvailableSlotsForMonth,
    approveAppointment
} from "../controllers/appointment.controller";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Appointment management
router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/slots", getAvailableSlots);
router.get("/slots/month", getAvailableSlotsForMonth);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointment);
router.put("/:id/approve", approveAppointment);
router.delete("/:id", cancelAppointment);

export default router; 