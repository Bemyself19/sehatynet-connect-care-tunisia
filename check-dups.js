const fs = require('fs');
const filePath = 'public/locales/en/translation.json';

try {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse the JSON to check for parsing errors
  try {
    JSON.parse(content);
    console.log('✅ JSON is valid');
  } catch (parseError) {
    console.error('❌ JSON parsing error:', parseError.message);
    process.exit(1);
  }
  
  // Now check for duplicate keys manually
  const lines = content.split('\n');
  const keyMap = {};
  const duplicates = [];
  
  // Simple regex to match keys in JSON
  const keyRegex = /^\s*"([^"]+)"\s*:/;
  
  lines.forEach((line, index) => {
    const match = line.match(keyRegex);
    if (match) {
      const key = match[1];
      if (keyMap[key]) {
        duplicates.push({ key, line: index + 1, previous: keyMap[key] });
      } else {
        keyMap[key] = index + 1;
      }
    }
  });
  
  if (duplicates.length) {
    console.log('❌ Duplicate keys found:');
    duplicates.forEach(d => console.log(`   - Key "${d.key}" found at line ${d.line}, previously at line ${d.previous}`));
  } else {
    console.log('✅ No duplicate keys found');
  }
  
} catch (error) {
  console.error('Error reading file:', error.message);
}
