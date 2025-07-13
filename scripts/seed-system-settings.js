/**
 * This script seeds the default system settings into the database
 * Run with: node scripts/seed-system-settings.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
// We'll import the model dynamically to avoid issues with ES modules vs CommonJS

// Setup path for .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine which .env file to use
const backendEnvPath = resolve(__dirname, '../backend/.env');
const rootEnvPath = resolve(__dirname, '../.env');

// Check which .env file exists and use it
if (fs.existsSync(backendEnvPath)) {
  console.log('Using backend/.env file');
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  console.log('Using root .env file');
  dotenv.config({ path: rootEnvPath });
} else {
  console.error('No .env file found in backend/ or root directory');
  process.exit(1);
}

async function seedSystemSettings() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI); // Log the URI to debug
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Default settings
    const defaultSettings = [
      { key: 'siteName', value: 'SehatyNet' },
      { key: 'contactEmail', value: 'contact@sehatynet.com' },
      { key: 'language', value: 'en' },
      { key: 'paymentsEnabled', value: false }, // Default to payments disabled
      { key: 'emailNotifications', value: true },
      { key: 'smsNotifications', value: false },
      { key: 'inAppNotifications', value: true },
    ];

    console.log('Seeding system settings...');
    
    // Import the SystemSetting model
    const SystemSettingModel = mongoose.model('SystemSetting', new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true }
    }, { timestamps: true }));

    // Upsert each setting (update if exists, insert if not)
    for (const setting of defaultSettings) {
      await SystemSettingModel.findOneAndUpdate(
        { key: setting.key },
        { value: setting.value },
        { upsert: true, new: true }
      );
      console.log(`✓ Setting "${setting.key}" created/updated`);
    }

    console.log('All system settings seeded successfully!');
  } catch (error) {
    console.error('Error seeding system settings:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedSystemSettings();
