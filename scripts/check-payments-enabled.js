// Script to check the current value of paymentsEnabled in MongoDB
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// For ESM, properly get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find and load the .env file (first in backend/, then in root)
const backendEnvPath = path.resolve(__dirname, '..', 'backend', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '.env');

if (fs.existsSync(backendEnvPath)) {
  console.log('Using backend/.env file');
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('Using root .env file');
  dotenv.config({ path: rootEnvPath });
} else {
  console.warn('No .env file found, using environment variables');
}

// Define schema for system settings
const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

async function checkPaymentsEnabled() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create model from schema
    const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
    
    // Find the paymentsEnabled setting
    const setting = await SystemSetting.findOne({ key: 'paymentsEnabled' });
    
    if (setting) {
      console.log('Found paymentsEnabled setting:');
      console.log('Value:', setting.value);
      console.log('Type:', typeof setting.value);
      console.log('Last updated:', setting.updatedAt);
    } else {
      console.log('paymentsEnabled setting not found in database');
    }

    // Show all settings
    console.log('\nAll settings in database:');
    const allSettings = await SystemSetting.find();
    allSettings.forEach(s => {
      console.log(`${s.key}:`, s.value, `(type: ${typeof s.value})`);
    });
  } catch (error) {
    console.error('Error checking payments enabled setting:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

checkPaymentsEnabled();
