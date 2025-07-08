import express from "express";
import multer from "multer";
import path from "path";
import { createMedicalRecord, getMedicalRecords } from "../controllers/medicalRecord.controller";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/upload", authenticateJWT, authorizeRoles("patient"), upload.single("file"), createMedicalRecord);
router.get("/my", authenticateJWT, authorizeRoles("patient"), getMedicalRecords);

export default router;