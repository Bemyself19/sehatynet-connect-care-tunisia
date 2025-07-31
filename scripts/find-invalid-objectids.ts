import mongoose from 'mongoose';
import MedicalRecord from '../backend/src/models/medicalRecord.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sehatynet';

function isValidObjectId(id: any): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const records = await MedicalRecord.find({});
  let invalid: Array<{ _id: any; field: string; value?: any }> = [];
  for (const rec of records) {
    if (!isValidObjectId(rec._id)) {
      invalid.push({ _id: rec._id, field: '_id' });
    }
    if (rec.providerId && !isValidObjectId(rec.providerId)) {
      invalid.push({ _id: rec._id, field: 'providerId', value: rec.providerId });
    }
    if (rec.details && rec.details.assignedPharmacyId && !isValidObjectId(rec.details.assignedPharmacyId)) {
      invalid.push({ _id: rec._id, field: 'details.assignedPharmacyId', value: rec.details.assignedPharmacyId });
    }
  }
  if (invalid.length === 0) {
    console.log('No invalid ObjectId values found.');
  } else {
    console.log('Invalid ObjectId values found:');
    console.table(invalid);
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
