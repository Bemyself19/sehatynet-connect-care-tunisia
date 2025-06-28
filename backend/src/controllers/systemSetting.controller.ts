import { Request, Response } from 'express';
import SystemSetting from '../models/systemSetting.model';

// Get all system settings as a key-value object
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SystemSetting.find();
    const settingsObj: Record<string, any> = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch system settings', error: err });
  }
};

// Update multiple system settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body; // { key1: value1, key2: value2, ... }
    const keys = Object.keys(updates);
    for (const key of keys) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value: updates[key] },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update system settings', error: err });
  }
}; 