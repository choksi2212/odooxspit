// Quick fix to remove Zod schema validations from routes
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/modules');

function removeSchemaFromFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove schema property from route definitions
  content = content.replace(/,\s*schema:\s*\{[^}]*body:\s*[^,}]+[^}]*\}/g, '');
  content = content.replace(/schema:\s*\{[^}]*body:\s*[^,}]+[^}]*\},\s*/g, '');
  content = content.replace(/schema:\s*\{[^}]*querystring:\s*[^,}]+[^}]*\},\s*/g, '');
  content = content.replace(/,\s*schema:\s*\{[^}]*querystring:\s*[^,}]+[^}]*\}/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.routes.ts')) {
      removeSchemaFromFile(fullPath);
    }
  });
}

console.log('Removing Zod schemas from routes...');
processDirectory(routesDir);
console.log('Done!');

