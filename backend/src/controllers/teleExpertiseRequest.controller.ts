import { Request, Response } from 'express';
import TeleExpertiseRequest from '../models/teleExpertiseRequest.model';
import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

export const createTeleExpertiseRequest = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, specialty, details } = req.body;
    const request = new TeleExpertiseRequest({ patientId, doctorId, specialty, details });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tele-expertise request', error: err });
  }
};

export const getTeleExpertiseRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requests = await TeleExpertiseRequest.find({ $or: [ { patientId: userId }, { doctorId: userId } ] })
      .populate('patientId', 'firstName lastName cnamId')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tele-expertise requests', error: err });
  }
};

export const updateTeleExpertiseRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, response, reportUrl } = req.body;
    const update: any = {};
    if (status) update.status = status;
    if (response) update.response = response;
    if (reportUrl) update.reportUrl = reportUrl;
    const updated = await TeleExpertiseRequest.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update tele-expertise request', error: err });
  }
};

export const uploadReportMiddleware = upload.single('file');
export const uploadReportHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const reportUrl = `/uploads/${req.file.filename}`;
    const updated = await TeleExpertiseRequest.findByIdAndUpdate(id, { reportUrl }, { new: true });
    if (!updated) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }
    res.json({ url: reportUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload report', error: err });
  }
};

export const uploadPatientFileMiddleware = upload.single('file');
export const uploadPatientFileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const patientFileUrl = `/uploads/${req.file.filename}`;
    const updated = await TeleExpertiseRequest.findByIdAndUpdate(id, { patientFileUrl }, { new: true });
    if (!updated) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }
    res.json({ url: patientFileUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload patient file', error: err });
  }
}; 