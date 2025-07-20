try {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join('public', 'locales', 'fr', 'translation.json');
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try to parse it
  JSON.parse(content);
  console.log('✓ French translation file is valid JSON');
  
} catch (error) {
  console.error('✗ Error validating French translation file:', error.message);
}
