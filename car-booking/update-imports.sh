#!/bin/bash

# Update all imports from './ui/' to '@/components/ui/'
find /Users/thanakorn/car-booking/car-booking/apps/web/src/components -name "*.tsx" -type f | while read file; do
  # Update imports from './ui/' to '@/components/ui/'
  sed -i '' "s|from '\./ui/|from '@/../../../../../../components/ui/|g" "$file"
  echo "Updated imports in: $file"
done

echo "All imports updated!"