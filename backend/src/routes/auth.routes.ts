import express from "express";
import { register, login, adminLogin, forgotPassword, resetPassword } from "../controllers/auth.controller";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
