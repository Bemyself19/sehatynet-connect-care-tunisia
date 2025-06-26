// Usage: node scripts/migrate-prescription-details.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehatynet';

const medicalRecordSchema = new mongoose.Schema({
  type: String,
  providerId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
}, { strict: false });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

async function migrate() {
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const allRecords = await MedicalRecord.find({});
  console.log('Total medical records in collection:', allRecords.length);

  let updatedPrescription = 0;
  let updatedLab = 0;
  let updatedImaging = 0;
  let sameIdCount = 0;

  for (const record of allRecords) {
    let updated = false;
    if (record.type === 'prescription' && record.providerId) {
      if (!record.details) record.details = {};
      if (!record.details.assignedPharmacyId) {
        record.details.assignedPharmacyId = record.providerId;
        updated = true;
        updatedPrescription++;
      }
    }
    if (record.type === 'lab_result' && record.providerId) {
      if (!record.details) record.details = {};
      if (!record.details.assignedLabId) {
        record.details.assignedLabId = record.providerId;
        updated = true;
        updatedLab++;
      }
    }
    if (record.type === 'imaging' && record.providerId) {
      if (!record.details) record.details = {};
      if (!record.details.assignedRadiologistId) {
        record.details.assignedRadiologistId = record.providerId;
        updated = true;
        updatedImaging++;
      }
    }
    if (record.patientId && record.providerId && record.patientId.toString() === record.providerId.toString()) {
      console.warn(`WARNING: Record ${record._id} has the same patientId and providerId: ${record.patientId}`);
      sameIdCount++;
    }
    if (updated) {
      await record.save();
      console.log(`Updated record ${record._id} (${record.type})`);
    }
  }

  console.log(`Migration complete.`);
  console.log(`Updated prescription records: ${updatedPrescription}`);
  console.log(`Updated lab_result records: ${updatedLab}`);
  console.log(`Updated imaging records: ${updatedImaging}`);
  console.log(`Found ${sameIdCount} records with the same patientId and providerId.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 