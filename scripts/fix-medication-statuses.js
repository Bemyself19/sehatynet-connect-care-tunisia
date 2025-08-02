// This script updates medication statuses from 'ready_for_pickup' to 'collected' 
// when the parent record status is 'completed'
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// Define MedicalRecord schema directly to avoid import issues
const medicalRecordSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  title: String,
  type: String,
  date: Date,
  details: mongoose.Schema.Types.Mixed,
  isPrivate: { type: Boolean, default: false },
  privacyLevel: { type: String, default: 'patient_visible' },
  status: String,
  files: [String]
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

async function updateMedicationStatuses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all completed medication records
    const completedRecords = await MedicalRecord.find({
      type: 'medication',
      status: 'completed'
    });

    console.log(`Found ${completedRecords.length} completed medication records`);
    
    // Track how many records and medications were updated
    let recordsUpdated = 0;
    let medicationsUpdated = 0;

    // Update each record
    for (const record of completedRecords) {
      let recordUpdated = false;
      
      if (record.details && record.details.medications && Array.isArray(record.details.medications)) {
        for (const medication of record.details.medications) {
          // Only update medications that are available and have a status other than 'unavailable' or 'collected'
          if (
            (medication.available !== false) && 
            medication.status && 
            medication.status !== 'unavailable' && 
            medication.status !== 'collected'
          ) {
            medication.status = 'collected';
            recordUpdated = true;
            medicationsUpdated++;
          }
        }
      }

      if (recordUpdated) {
        await record.save();
        recordsUpdated++;
        console.log(`Updated record ${record._id}`);
      }
    }

    console.log(`Updated ${medicationsUpdated} medications in ${recordsUpdated} records`);
  } catch (error) {
    console.error('Error updating medication statuses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
updateMedicationStatuses().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
