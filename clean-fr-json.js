const fs = require('fs');
const path = require('path');

// Path to the translation file
const filePath = 'public/locales/fr/translation.json';

// Read the file
try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try parsing it as JSON
  try {
    const parsed = JSON.parse(content);
    
    // Create a new clean object
    const cleanObject = {};
    
    // Iterate through keys to remove duplicates, keeping the first occurrence
    function cleanDuplicates(obj, target = {}) {
      Object.keys(obj).forEach(key => {
        // If the property hasn't been added yet, add it
        if (target[key] === undefined) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Handle nested objects
            target[key] = {};
            cleanDuplicates(obj[key], target[key]);
          } else {
            target[key] = obj[key];
          }
        }
      });
      
      return target;
    }
    
    // Clean the object
    const cleanedJSON = cleanDuplicates(parsed);
    
    // Write back to a new file first to be safe
    fs.writeFileSync(filePath + '.clean', JSON.stringify(cleanedJSON, null, 2), 'utf8');
    console.log('✅ Created clean file at ' + filePath + '.clean');
    console.log('Please verify the contents before replacing the original file');
    
  } catch (parseError) {
    console.error('❌ Error parsing JSON:', parseError.message);
  }
} catch (fileError) {
  console.error('❌ Error reading file:', fileError.message);
}
