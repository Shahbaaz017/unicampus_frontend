#!/bin/bash

# Define the output file
OUTPUT_FILE="project_context_for_resource_delete.txt"

# Clear the output file if it already exists
> "$OUTPUT_FILE"

echo "Dumping relevant file contents to $OUTPUT_FILE..."
echo "-------------------------------------------------" >> "$OUTPUT_FILE"
echo "PROJECT CONTEXT FOR RESOURCE DELETE FEATURE" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "-------------------------------------------------" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# List of files to dump
# Adjust these paths if your project structure is different for any of these.
FILES_TO_DUMP=(
  "src/types/resource.ts"                 # Or your specific type definition for a resource
  "src/types/community.ts"                # Included from original tree, might have relevant types
  "src/components/resources/ResourcesScreen.tsx"
  "src/components/resources/CreateResourceScreen.tsx" # Might be relevant for consistency
  "src/lib/apiClient.ts"                  # Your API client
  "src/lib/utils.ts"                      # For the 'cn' utility if using shadcn/ui
  "src/components/ui/button.tsx"          # shadcn/ui Button
  "src/components/ui/alert-dialog.tsx"    # shadcn/ui AlertDialog
  "src/components/ui/use-toast.ts"        # shadcn/ui useToast hook
  "src/components/ui/toast.tsx"           # shadcn/ui Toast component definitions
  "src/components/ui/toaster.tsx"         # shadcn/ui Toaster component
  "src/App.tsx"                           # Main App component, to see layout and Toaster placement
  "src/hooks/use-toast.ts"                # Custom toast hook (if different from shadcn/ui's)
  # Add any other file you think is relevant, for example, if your resource items are a separate component:
  # "src/components/resources/ResourceListItem.tsx"
)

for FILE_PATH in "${FILES_TO_DUMP[@]}"; do
  echo "Processing: $FILE_PATH"
  echo "FILE: $FILE_PATH" >> "$OUTPUT_FILE"
  echo "--- START OF FILE ---" >> "$OUTPUT_FILE"
  if [ -f "$FILE_PATH" ]; then
    cat "$FILE_PATH" >> "$OUTPUT_FILE"
  else
    echo "--- FILE NOT FOUND AT THIS PATH ---" >> "$OUTPUT_FILE"
  fi
  echo "--- END OF FILE ---" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE" # Add a blank line for readability
done

echo "-------------------------------------------------" >> "$OUTPUT_FILE"
echo "END OF DUMP" >> "$OUTPUT_FILE"
echo "-------------------------------------------------" >> "$OUTPUT_FILE"

echo ""
echo "Done. The content of the specified files has been dumped into: $OUTPUT_FILE"
echo "Please provide this file."