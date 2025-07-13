const fs = require('fs');
const path = require('path');

// Function to find duplicate keys in an object
function findDuplicateKeys(obj, prefix = '', result = {}) {
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    // If the property is an object, recursively check it
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      findDuplicateKeys(obj[key], fullPath, result);
    }
    
    // Add the key to the result map
    if (!result[key]) {
      result[key] = [fullPath];
    } else {
      result[key].push(fullPath);
    }
  }
  
  // Filter out keys that don't have duplicates
  return Object.entries(result)
    .filter(([_, paths]) => paths.length > 1)
    .reduce((acc, [key, paths]) => {
      acc[key] = paths;
      return acc;
    }, {});
}

try {
  const filePath = path.join('public', 'locales', 'en', 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Try to parse the JSON
    const jsonObj = JSON.parse(fileContent);
    
    // Find duplicate keys
    const duplicates = findDuplicateKeys(jsonObj);
    
    if (Object.keys(duplicates).length > 0) {
      console.log('Found duplicate keys:');
      console.log(JSON.stringify(duplicates, null, 2));
    } else {
      console.log('No duplicate keys found in the parsed JSON.');
    }
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError.message);
    
    // Try to find the position of the error
    if (parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const errorContext = fileContent.substring(
          Math.max(0, pos - 40),
          Math.min(fileContent.length, pos + 40)
        );
        console.log(`Error context around position ${pos}:`);
        console.log(errorContext);
        
        // Try to identify potential duplicate keys near the error
        const lines = fileContent.split('\n');
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          charCount += lines[i].length + 1; // +1 for the newline
          if (charCount >= pos) {
            console.log(`Error might be around line ${i + 1}`);
            
            // Show a few lines before and after
            const startLine = Math.max(0, i - 5);
            const endLine = Math.min(lines.length, i + 5);
            for (let j = startLine; j < endLine; j++) {
              console.log(`${j + 1}: ${lines[j]}`);
            }
            break;
          }
        }
      }
    }
  }
} catch (fileError) {
  console.error('Error reading file:', fileError.message);
}
