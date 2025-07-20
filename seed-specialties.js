// No import or require needed for fetch in Node.js 18+

const specialties = [
  { name: 'General Practitioner', description: 'Primary care and general health' },
  { name: 'Cardiologist', description: 'Heart specialist' },
  { name: 'Dermatologist', description: 'Skin specialist' },
  { name: 'Orthopedist', description: 'Bone and joint specialist' },
  { name: 'Neurologist', description: 'Nervous system specialist' },
  { name: 'Pediatrician', description: 'Child health specialist' },
  { name: 'Gynecologist', description: 'Women\'s health specialist' },
  { name: 'Psychiatrist', description: 'Mental health specialist' }
];

// <<<--- PASTE YOUR JWT TOKEN HERE --->>>
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NTk2NTMzYmU5ODRkMjBhYWYwYmRiMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDY4OTE5OCwiZXhwIjoxNzUwNzc1NTk4fQ.wkj7G9W3kpWguYzlZn5MvS1uVSoBD8-iSNjst7WwOGE';

async function seed() {
  for (const specialty of specialties) {
    const res = await fetch('https://localhost:5000/api/specialties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(specialty)
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`Added: ${specialty.name}`);
    } else {
      console.error(`Failed to add ${specialty.name}:`, data.message || data);
    }
  }
}

seed(); 