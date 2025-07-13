const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join('public', 'locales', 'en', 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Use regular expressions to find all key-value pairs
  const keyRegex = /"([^"]+)"\s*:/g;
  let match;
  const keys = [];
  const positions = [];
  
  while ((match = keyRegex.exec(fileContent)) !== null) {
    const key = match[1];
    const position = match.index;
    keys.push(key);
    positions.push(position);
  }
  
  // Check for duplicates
  const keyMap = {};
  const duplicates = [];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const position = positions[i];
    
    if (keyMap[key] !== undefined) {
      duplicates.push({
        key,
        firstOccurrence: keyMap[key],
        duplicateOccurrence: position
      });
    } else {
      keyMap[key] = position;
    }
  }
  
  if (duplicates.length > 0) {
    console.log('Found duplicate keys:');
    for (const dup of duplicates) {
      // Calculate line numbers
      const firstLine = fileContent.substring(0, dup.firstOccurrence).split('\n').length;
      const dupLine = fileContent.substring(0, dup.duplicateOccurrence).split('\n').length;
      
      console.log(`Key "${dup.key}" appears on line ${firstLine} and line ${dupLine}`);
    }
  } else {
    console.log('No duplicate keys found in the JSON file.');
  }
  
  // Check for JSON syntax errors
  try {
    JSON.parse(fileContent);
    console.log('JSON syntax is valid.');
  } catch (parseError) {
    console.error('JSON syntax error:', parseError.message);
    
    // Try to find the position of the error
    if (parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const lineNumber = fileContent.substring(0, pos).split('\n').length;
        console.log(`Error is likely on line ${lineNumber}`);
        
        // Show the context around the error
        const lines = fileContent.split('\n');
        const startLine = Math.max(0, lineNumber - 3);
        const endLine = Math.min(lines.length, lineNumber + 2);
        
        console.log('Context:');
        for (let i = startLine; i < endLine; i++) {
          const prefix = i === lineNumber - 1 ? '> ' : '  ';
          console.log(`${prefix}${i + 1}: ${lines[i]}`);
        }
      }
    }
  }
} catch (fileError) {
  console.error('Error reading file:', fileError.message);
}
