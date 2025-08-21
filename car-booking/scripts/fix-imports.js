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
  
  // Update UI component imports
  const uiPatterns = [
    /from ['"]\.\/ui\/([^'"]+)['"]/g,
    /from ['"]\.\.\/ui\/([^'"]+)['"]/g,
    /from ['"]\.\.\/\.\.\/ui\/([^'"]+)['"]/g,
    /from ['"]@\/components\/ui\/([^'"]+)['"]/g,
  ];
  
  uiPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, "from '@car-booking/ui'");
      hasChanges = true;
    }
  });
  
  // Fix the broken imports from the previous script
  content = content.replace(/from '@car-booking\/ui'([^'"\s]+)/g, "from '@car-booking/ui'");
  
  // Update types imports
  const typePatterns = [
    /from ['"]@\/types['"]/g,
    /from ['"]\.\.\/types['"]/g,
    /from ['"]\.\.\/\.\.\/types['"]/g,
  ];
  
  typePatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, "from '@car-booking/types'");
      hasChanges = true;
    }
  });
  
  // Update utils imports
  const utilPatterns = [
    /from ['"]@\/lib\/utils['"]/g,
    /from ['"]\.\.\/lib\/utils['"]/g,
    /from ['"]\.\.\/\.\.\/lib\/utils['"]/g,
  ];
  
  utilPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, "from '@car-booking/utils'");
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(webSrcPath, filePath)}`);
  }
}

// Main execution
console.log('Fixing imports in web app...');

const files = findFiles(webSrcPath);
files.forEach(updateImports);

console.log('Import updates completed!');