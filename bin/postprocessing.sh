#!/usr/bin/env bash

# Determine which sed to use (gsed on macOS, sed on Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS - check if gsed is installed
  if command -v gsed &> /dev/null; then
    SED_CMD="gsed"
  else
    echo "Error: GNU sed (gsed) is not installed. Please install it with 'brew install gnu-sed'"
    echo "Or run: pnpm add -D gnu-sed"
    exit 1
  fi
else
  # Linux and other systems
  SED_CMD="sed"
fi

echo "Using $SED_CMD for text processing"

# Example usage:
# $SED_CMD -i 's/pattern/replacement/g' file.txt

#rsync -a ./dist/src/ ./dist/
#rm -rf ./dist/src

#find ./dist -type f -exec $SED_CMD -i -E 's#from "(\.)+/src/([^"]+)\.(ts|js)"#from "\1/\2.\3"#' {} \;
#find ./dist -type f -exec $SED_CMD -i -E 's#import "(\.)+/src/([^"]+)\.(ts|js)"#import "\1\2.\3"#' {} \;
#find ./dist -type f -exec $SED_CMD -i -E "s#imports: \['(.*)\.ts(.*)'\]#imports: \['.\1\.js\2'\]#g" {} \;

# Fix imports in html generated inside .js files
find ./dist -type f -iname '*.js' -exec $SED_CMD -i -E 's#from "(\.)+/(.*)\.ts#from "\1/\2.js#' {} \;
find ./dist -type f -iname '*.js' -exec $SED_CMD -i -E 's#import "(\.)+/(.*)\.ts#import "\1/\2.js#' {} \;

# Fix component paths in HTML files to use absolute paths
find ./dist -type f -iname '*.html' -exec $SED_CMD -i -E 's#src="(\.)*/components/([^"]+)\.(js|ts)"#src="/node_modules/greenwoodspectrumtheme/components/\2\.js"#g' {} \;
find ./dist -type f -iname '*.html' -exec $SED_CMD -i -E 's#src="(\.)*/src/components/([^"]+)\.ts"#src="/node_modules/greenwoodspectrumtheme/components/\2\.js"#g' {} \;
