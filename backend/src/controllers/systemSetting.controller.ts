import { Request, Response } from 'express';
import SystemSetting from '../models/systemSetting.model';

// Get all system settings as a key-value object
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    console.log('Backend: Fetching all system settings');
    const settings = await SystemSetting.find();
    console.log('Backend: Found settings:', settings);
    
    const settingsObj: Record<string, any> = {};
    settings.forEach(s => { 
      console.log(`Backend: Adding setting ${s.key} with value:`, s.value);
      settingsObj[s.key] = s.value; 
    });
    
    // Explicitly log if paymentsEnabled exists
    if ('paymentsEnabled' in settingsObj) {
      console.log(`Backend: paymentsEnabled value is ${settingsObj.paymentsEnabled}`);
    } else {
      console.log('Backend: paymentsEnabled not found in settings');
    }
    
    console.log('Backend: Returning settings object:', settingsObj);
    res.json(settingsObj);
  } catch (err) {
    console.error('Backend: Error fetching system settings:', err);
    res.status(500).json({ message: 'Failed to fetch system settings', error: err });
  }
};

// Update multiple system settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    console.log('Backend: Updating system settings');
    console.log('Backend: Received updates:', req.body);
    
    const updates = req.body; // { key1: value1, key2: value2, ... }
    const keys = Object.keys(updates);
    
    console.log('Backend: Processing keys:', keys);
    
    // Check if paymentsEnabled is being updated
    if ('paymentsEnabled' in updates) {
      console.log(`Backend: Updating paymentsEnabled to ${updates.paymentsEnabled}`);
    }
    
    for (const key of keys) {
      console.log(`Backend: Updating setting ${key} to:`, updates[key]);
      
      const result = await SystemSetting.findOneAndUpdate(
        { key },
        { value: updates[key] },
        { upsert: true, new: true }
      );
      
      console.log(`Backend: Update result for ${key}:`, result);
    }
    
    // Verify the update by retrieving paymentsEnabled
    if ('paymentsEnabled' in updates) {
      const setting = await SystemSetting.findOne({ key: 'paymentsEnabled' });
      console.log('Backend: Verified paymentsEnabled after update:', setting?.value);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Backend: Error updating system settings:', err);
    res.status(500).json({ message: 'Failed to update system settings', error: err });
  }
}; 