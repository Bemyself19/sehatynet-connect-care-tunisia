/**
 * This script toggles the payment setting in the database
 * Run with: node scripts/toggle-payments.js [on|off]
 * 
 * Example: 
 *   - To enable payments: node scripts/toggle-payments.js on
 *   - To disable payments: node scripts/toggle-payments.js off
 */
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

async function togglePayments() {
  try {
    // Get command line argument
    const args = process.argv.slice(2);
    const toggle = args[0] && args[0].toLowerCase();
    
    if (!toggle || (toggle !== 'on' && toggle !== 'off')) {
      console.error('Please specify either "on" or "off" as an argument.');
      console.error('Example: node scripts/toggle-payments.js on');
      process.exit(1);
    }
    
    const enabled = toggle === 'on';
    
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create model from schema
    const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
    
    // Update the payments setting
    const result = await SystemSetting.findOneAndUpdate(
      { key: 'paymentsEnabled' },
      { value: enabled },
      { upsert: true, new: true }
    );

    if (result) {
      console.log(`✅ Payments have been turned ${enabled ? 'ON' : 'OFF'}`);
    } else {
      console.log('⚠️ Could not update setting, but no error was thrown.');
    }
    
    // Show current state of all system settings
    const settings = await SystemSetting.find();
    console.log('\nCurrent system settings:');
    settings.forEach(s => {
      console.log(`- ${s.key}: ${JSON.stringify(s.value)}`);
    });
    
  } catch (error) {
    console.error('Error toggling payment setting:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

togglePayments();
