const { MongoClient } = require('mongodb');

async function fixSystemSettings() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('sehatynet');
    const collection = db.collection('systemsettings');
    
    // Clear existing settings
    await collection.deleteMany({});
    console.log('Cleared existing system settings');
    
    // Insert default settings
    const defaultSettings = [
      { key: 'siteName', value: 'SehatyNet+' },
      { key: 'contactEmail', value: 'contact@sehatynet.com' },
      { key: 'language', value: 'en' },
      { key: 'paymentsEnabled', value: true }, // Enable payments by default
      { key: 'emailNotifications', value: true },
      { key: 'smsNotifications', value: false },
      { key: 'inAppNotifications', value: true },
      { key: 'timezone', value: 'Africa/Tunis' },
    ];
    
    const result = await collection.insertMany(defaultSettings);
    console.log(`Inserted ${result.insertedCount} system settings`);
    
    // Verify the insertion
    const settings = await collection.find({}).toArray();
    console.log('Current system settings:');
    settings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

fixSystemSettings();
