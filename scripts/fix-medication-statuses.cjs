// This script updates medication statuses from 'ready_for_pickup' to 'collected' 
// when the parent record status is 'completed'
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple schema for the MedicalRecord to access the collection
    const medicalRecordSchema = new mongoose.Schema({}, { strict: false });
    const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
    
    // Find all completed medication records
    return MedicalRecord.find({
      type: 'medication',
      status: 'completed'
    });
  })
  .then((completedRecords) => {
    console.log(`Found ${completedRecords.length} completed medication records`);
    
    // Track how many records and medications were updated
    let recordsUpdated = 0;
    let medicationsUpdated = 0;

    // Process each record
    const updatePromises = completedRecords.map(async (record) => {
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
    });

    return Promise.all(updatePromises).then(() => {
      console.log(`Updated ${medicationsUpdated} medications in ${recordsUpdated} records`);
    });
  })
  .catch((err) => {
    console.error('Error updating medication statuses:', err);
  })
  .finally(() => {
    // Disconnect from MongoDB
    mongoose.disconnect().then(() => {
      console.log('Disconnected from MongoDB');
    });
  });
