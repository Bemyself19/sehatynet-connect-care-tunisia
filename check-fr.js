const fs = require('fs');
const path = require('path');

const filePath = path.join('public', 'locales', 'fr', 'translation.json');

try {
  console.log('Starting validation of French translation file...');
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try parsing the JSON
  try {
    JSON.parse(content);
    console.log('✅ JSON syntax is valid');
  } catch (parseError) {
    console.error('❌ JSON syntax error:', parseError.message);
    
    // Try to locate the error position
    if (parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const lines = content.split('\n');
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1; // +1 for newline
          if (charCount + lineLength > pos) {
            const charInLine = pos - charCount;
            console.error(`Error near line ${i + 1}, character ${charInLine}`);
            
            // Show the problematic line and a few lines around it
            const startLine = Math.max(0, i - 2);
            const endLine = Math.min(lines.length, i + 3);
            for (let j = startLine; j < endLine; j++) {
              const prefix = j === i ? '> ' : '  ';
              console.log(`${prefix}${j + 1}: ${lines[j]}`);
            }
            
            // Point to the specific character with an arrow
            if (charInLine >= 0) {
              const arrow = ' '.repeat(charInLine + prefix.length + (j + 1).toString().length + 2) + '^';
              console.log(arrow);
            }
            
            break;
          }
          charCount += lineLength;
        }
      }
    }
    
    process.exit(1);
  }
  
  // Check for duplicate keys by line
  const lines = content.split('\n');
  const keyMap = {};
  const duplicates = [];
  
  // Regular expression to match JSON key at the start of a line
  const keyRegex = /^\s*"([^"]+)"\s*:/;
  
  lines.forEach((line, index) => {
    const match = line.match(keyRegex);
    if (match) {
      const key = match[1];
      if (keyMap[key]) {
        duplicates.push({
          key,
          line: index + 1,
          previousLine: keyMap[key]
        });
      } else {
        keyMap[key] = index + 1;
      }
    }
  });
  
  if (duplicates.length > 0) {
    console.error('\n❌ Found duplicate keys:');
    duplicates.forEach(({ key, line, previousLine }) => {
      console.error(`  - "${key}" appears at line ${line}, previously at line ${previousLine}`);
    });
    process.exit(1);
  } else {
    console.log('✅ No duplicate keys found');
  }
  
  console.log('✅ French translation file is valid!');
  
} catch (error) {
  console.error(`❌ Error reading file: ${error.message}`);
  process.exit(1);
}
