const fs = require('fs');
const path = require('path');

// Define the paths to update
const webSrcPath = '/Users/thanakorn/car-booking/car-booking/apps/web/src';

// Function to recursively find all TypeScript/React files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  const originalContent = content;
  
  // Fix broken imports from previous script (e.g., '@car-booking/ui'button')
  content = content.replace(/from '@car-booking\/ui'[a-z-]+'/g, "from '@car-booking/ui'");
  
  // Update UI component imports - handle all variations
  content = content.replace(/from ['"]\.\/ui\/[^'"]+['"]/g, "from '@car-booking/ui'");
  content = content.replace(/from ['"]\.\.\/ui\/[^'"]+['"]/g, "from '@car-booking/ui'");
  content = content.replace(/from ['"]\.\.\/\.\.\/ui\/[^'"]+['"]/g, "from '@car-booking/ui'");
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/ui\/[^'"]+['"]/g, "from '@car-booking/ui'");
  content = content.replace(/from ['"]@\/components\/ui\/[^'"]+['"]/g, "from '@car-booking/ui'");
  
  // Update types imports
  content = content.replace(/from ['"]@\/types['"]/g, "from '@car-booking/types'");
  content = content.replace(/from ['"]\.\/types['"]/g, "from '@car-booking/types'");
  content = content.replace(/from ['"]\.\.\/types['"]/g, "from '@car-booking/types'");
  content = content.replace(/from ['"]\.\.\/\.\.\/types['"]/g, "from '@car-booking/types'");
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/types['"]/g, "from '@car-booking/types'");
  
  // Update utils imports
  content = content.replace(/from ['"]@\/lib\/utils['"]/g, "from '@car-booking/utils'");
  content = content.replace(/from ['"]\.\/lib\/utils['"]/g, "from '@car-booking/utils'");
  content = content.replace(/from ['"]\.\.\/lib\/utils['"]/g, "from '@car-booking/utils'");
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/utils['"]/g, "from '@car-booking/utils'");
  
  // Import cn from utils
  content = content.replace(/import { cn } from ['"]@car-booking\/ui['"]/g, "import { cn } from '@car-booking/utils'");
  
  hasChanges = content !== originalContent;
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(webSrcPath, filePath)}`);
  }
}

// Main execution
console.log('Fixing all imports in web app...');

const files = findFiles(webSrcPath);
files.forEach(updateImports);

console.log('Import updates completed!');