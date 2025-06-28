import express from "express";
import { 
    createAppointment, 
    getAppointments, 
    getAppointmentById, 
    updateAppointment, 
    cancelAppointment, 
    getAvailableSlots, 
    getAvailableSlotsForMonth 
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
router.delete("/:id", cancelAppointment);

export default router; 