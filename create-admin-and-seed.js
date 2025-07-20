// Script to create admin user and seed specialties
const specialties = [
  { name: 'General Practitioner', description: 'Primary care and general health' },
  { name: 'Cardiologist', description: 'Heart specialist' },
  { name: 'Dermatologist', description: 'Skin specialist' },
  { name: 'Orthopedist', description: 'Bone and joint specialist' },
  { name: 'Neurologist', description: 'Nervous system specialist' },
  { name: 'Pediatrician', description: 'Child health specialist' },
  { name: 'Gynecologist', description: 'Women\'s health specialist' },
  { name: 'Psychiatrist', description: 'Mental health specialist' },
  { name: 'Ophthalmologist', description: 'Eye specialist' },
  { name: 'ENT Specialist', description: 'Ear, Nose, and Throat specialist' },
  { name: 'Urologist', description: 'Urinary system specialist' },
  { name: 'Endocrinologist', description: 'Hormone specialist' }
];

const BASE_URL = 'https://localhost:5000/api';

// Ignore self-signed certificate errors for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@sehatynet.com',
      password: 'admin123456',
      role: 'admin',
      phone: '+1234567890'
    };

    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
      return result.token || result.access_token;
    } else {
      console.log('ℹ️ Admin user might already exist, trying to login...');
      return await loginAdmin(adminData.email, adminData.password);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.log('Trying to login with existing admin...');
    return await loginAdmin('admin@sehatynet.com', 'admin123456');
  }
}

async function loginAdmin(email, password) {
  try {
    console.log('Logging in admin user...');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin login successful!');
      return result.token || result.access_token;
    } else {
      throw new Error(result.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Error logging in admin:', error.message);
    throw error;
  }
}

async function seedSpecialties(token) {
  console.log('\n🌱 Seeding specialties...');
  
  let successCount = 0;
  let skipCount = 0;
  
  for (const specialty of specialties) {
    try {
      const response = await fetch(`${BASE_URL}/specialties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(specialty)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Added: ${specialty.name}`);
        successCount++;
      } else if (response.status === 400 && result.message && result.message.includes('duplicate')) {
        console.log(`⏭️ Already exists: ${specialty.name}`);
        skipCount++;
      } else {
        console.error(`❌ Failed to add ${specialty.name}:`, result.message || result);
      }
    } catch (error) {
      console.error(`❌ Error adding ${specialty.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️ Already existed: ${skipCount}`);
  console.log(`❌ Failed: ${specialties.length - successCount - skipCount}`);
}

async function main() {
  try {
    console.log('🚀 Starting admin creation and specialty seeding...\n');
    
    // Create/login admin user
    const token = await createAdminUser();
    
    if (!token) {
      throw new Error('Failed to get admin token');
    }
    
    console.log('🔑 Admin token obtained successfully!\n');
    
    // Seed specialties
    await seedSpecialties(token);
    
    console.log('\n✅ Process completed successfully!');
    console.log('\n📝 Admin credentials:');
    console.log('Email: admin@sehatynet.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
