const fs = require('fs');
const filePath = 'public/locales/en/translation.json';

try {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract keys using regex
  const keys = [];
  const regex = /\"([^\"]+)\"\s*:/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  
  // Check for duplicates
  const keyMap = {};
  const duplicates = [];
  
  keys.forEach((key, index) => {
    if (keyMap[key] !== undefined) {
      duplicates.push({
        key,
        firstPosition: keyMap[key],
        duplicatePosition: index
      });
    } else {
      keyMap[key] = index;
    }
  });
  
  if (duplicates.length > 0) {
    console.log('Found duplicate keys:');
    duplicates.forEach(dup => {
      console.log(`Key "${dup.key}" appears at positions ${dup.firstPosition} and ${dup.duplicatePosition}`);
    });
  } else {
    console.log('No duplicate keys found');
  }
} catch (error) {
  console.error('Error:', error.message);
}
