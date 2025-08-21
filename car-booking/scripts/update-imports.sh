#!/bin/bash

# Update imports in web app
echo "Updating imports in web app..."

# Find all TypeScript/React files
find /Users/thanakorn/car-booking/car-booking/apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) | while read file; do
  # Skip node_modules
  if [[ "$file" == *"node_modules"* ]]; then
    continue
  fi
  
  # Update UI component imports
  sed -i '' "s|from '\./ui/|from '@car-booking/ui'|g" "$file"
  sed -i '' "s|from '\.\.\/ui\/|from '@car-booking/ui'|g" "$file"
  sed -i '' "s|from '\.\.\/\.\.\/ui\/|from '@car-booking/ui'|g" "$file"
  sed -i '' "s|from '@\/components\/ui\/|from '@car-booking/ui'|g" "$file"
  
  # Update types imports
  sed -i '' "s|from '@\/types'|from '@car-booking/types'|g" "$file"
  sed -i '' "s|from '\.\.\/types'|from '@car-booking/types'|g" "$file"
  sed -i '' "s|from '\.\.\/\.\.\/types'|from '@car-booking/types'|g" "$file"
  
  # Update utils imports
  sed -i '' "s|from '@\/lib\/utils'|from '@car-booking/utils'|g" "$file"
  sed -i '' "s|from '\.\.\/lib\/utils'|from '@car-booking/utils'|g" "$file"
  sed -i '' "s|from '\.\.\/\.\.\/lib\/utils'|from '@car-booking/utils'|g" "$file"
done

echo "Import updates completed!"