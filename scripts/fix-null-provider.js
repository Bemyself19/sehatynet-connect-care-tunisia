// Usage: node scripts/fix-null-provider.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehatynet';

const PHARMACY_ID = '685ab326fc991f6ec73c6abd';
const LAB_ID = '685ab36cfc991f6ec73c6ac3';
const RADIOLOGIST_ID = '685ab349fc991f6ec73c6ac0';

const medicalRecordSchema = new mongoose.Schema({
  patientId: mongoose.Schema.Types.ObjectId,
  providerId: mongoose.Schema.Types.ObjectId,
  type: String,
  details: mongoose.Schema.Types.Mixed,
}, { strict: false });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

async function fixNullProvider() {
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const records = await MedicalRecord.find({ providerId: null });
  console.log(`Found ${records.length} records with providerId: null.`);

  let fixedCount = 0;
  let autoAssigned = 0;
  let missingAssignment = 0;
  for (const record of records) {
    let newProviderId = null;
    if (record.type === 'prescription') {
      newProviderId = PHARMACY_ID;
    } else if (record.type === 'lab_result') {
      newProviderId = LAB_ID;
    } else if (record.type === 'imaging') {
      newProviderId = RADIOLOGIST_ID;
    }
    if (newProviderId) {
      record.providerId = newProviderId;
      await record.save();
      autoAssigned++;
      console.log(`Auto-assigned providerId for record ${record._id} (${record.type}): ${newProviderId}`);
    } else {
      missingAssignment++;
      console.warn(`WARNING: Could not auto-assign providerId for record ${record._id} (${record.type}).`);
    }
    fixedCount++;
  }

  console.log(`Fix complete. Updated ${fixedCount} records.`);
  console.log(`Auto-assigned providerId for ${autoAssigned} records.`);
  console.log(`Could not assign providerId for ${missingAssignment} records.`);
  await mongoose.disconnect();
}

fixNullProvider().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
}); 