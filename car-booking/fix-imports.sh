#!/bin/bash

# Update all imports to use @ui/ alias
find /Users/thanakorn/car-booking/car-booking/apps/web/src/components -name "*.tsx" -type f | while read file; do
  # Update the long relative imports to @ui/
  sed -i '' "s|from '@/\.\./\.\./\.\./\.\./\.\./\.\./components/ui/|from '@ui/|g" "$file"
  echo "Fixed imports in: $file"
done

echo "All imports fixed!"