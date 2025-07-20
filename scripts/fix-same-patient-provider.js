// Usage: node scripts/fix-same-patient-provider.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehatynet';

const medicalRecordSchema = new mongoose.Schema({
  patientId: mongoose.Schema.Types.ObjectId,
  providerId: mongoose.Schema.Types.ObjectId,
  type: String,
  details: mongoose.Schema.Types.Mixed,
}, { strict: false });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

async function fixSamePatientProvider() {
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const problematicRecords = await MedicalRecord.find({
    $expr: { $eq: ['$patientId', '$providerId'] }
  });

  console.log(`Found ${problematicRecords.length} records with the same patientId and providerId.`);

  let fixedCount = 0;
  let autoAssigned = 0;
  let missingAssignment = 0;
  for (const record of problematicRecords) {
    let newProviderId = null;
    if (record.type === 'prescription' && record.details) {
      if (record.details.assignedPharmacyId) {
        newProviderId = record.details.assignedPharmacyId;
      } else if (Array.isArray(record.details.medications) && record.details.medications[0] && record.details.medications[0].providerId) {
        newProviderId = record.details.medications[0].providerId;
      }
    } else if (record.type === 'lab_result' && record.details) {
      if (record.details.assignedLabId) {
        newProviderId = record.details.assignedLabId;
      } else if (Array.isArray(record.details.labTests) && record.details.labTests[0] && record.details.labTests[0].providerId) {
        newProviderId = record.details.labTests[0].providerId;
      }
    } else if (record.type === 'imaging' && record.details) {
      if (record.details.assignedRadiologistId) {
        newProviderId = record.details.assignedRadiologistId;
      } else if (Array.isArray(record.details.radiology) && record.details.radiology[0] && record.details.radiology[0].providerId) {
        newProviderId = record.details.radiology[0].providerId;
      }
    }
    if (newProviderId) {
      record.providerId = newProviderId;
      await record.save();
      autoAssigned++;
      console.log(`Auto-assigned providerId for record ${record._id} (${record.type}): ${newProviderId}`);
    } else {
      record.providerId = null;
      await record.save();
      missingAssignment++;
      console.warn(`WARNING: Could not auto-assign providerId for record ${record._id} (${record.type}). Set to null.`);
    }
    fixedCount++;
  }

  console.log(`Fix complete. Updated ${fixedCount} records.`);
  console.log(`Auto-assigned providerId for ${autoAssigned} records.`);
  console.log(`Set providerId to null for ${missingAssignment} records (missing assigned*Id and array providerId).`);
  await mongoose.disconnect();
}

fixSamePatientProvider().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
}); 