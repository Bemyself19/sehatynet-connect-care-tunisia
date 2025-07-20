const fs = require('fs');
const path = require('path');

try {
  // Read the translation file
  const filePath = path.join(__dirname, 'public', 'locales', 'en', 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Attempt to parse the JSON to validate it
    JSON.parse(fileContent);
    console.log('✓ JSON is valid');
    
    // Now look for duplicate keys by manually parsing the file
    const lines = fileContent.split('\n');
    const keys = new Map();
    const duplicates = [];
    
    let lineNum = 0;
    let inObject = false;
    
    for (const line of lines) {
      lineNum++;
      
      // Skip empty lines or lines that are just brackets/braces
      if (!line.trim() || line.trim() === '{' || line.trim() === '}') {
        continue;
      }
      
      // Check if this line contains a key
      const keyMatch = line.match(/^\s*"([^"]+)"\s*:/);
      if (keyMatch) {
        const key = keyMatch[1];
        
        if (keys.has(key)) {
          duplicates.push({
            key,
            firstLine: keys.get(key),
            duplicateLine: lineNum
          });
        } else {
          keys.set(key, lineNum);
        }
      }
    }
    
    if (duplicates.length > 0) {
      console.log('❌ Found duplicate keys:');
      duplicates.forEach(dup => {
        console.log(`  "${dup.key}" appears at lines ${dup.firstLine} and ${dup.duplicateLine}`);
      });
    } else {
      console.log('✓ No duplicate keys found');
    }
  } catch (parseError) {
    console.log('❌ Invalid JSON:');
    console.log(parseError.message);
    
    // Try to identify the location of the error
    const match = parseError.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const errorContext = fileContent.substring(
        Math.max(0, pos - 40),
        Math.min(fileContent.length, pos + 40)
      );
      
      // Count lines up to the error position
      const contentUpToError = fileContent.substring(0, pos);
      const lineNum = contentUpToError.split('\n').length;
      
      console.log(`Error around line ${lineNum}:`);
      console.log(errorContext);
    }
  }
} catch (fileError) {
  console.log('❌ Error reading file:');
  console.log(fileError.message);
}
