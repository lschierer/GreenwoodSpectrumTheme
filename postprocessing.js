// process-dist.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, "dist/temp");
const distDir = path.join(__dirname, "dist");

console.log("Starting distribution processing...");

// Create the final dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process root files (files directly in the temp directory)
try {
  const rootFiles = fs
    .readdirSync(tempDir)
    .filter(
      (file) =>
        !file.startsWith("src") &&
        !fs.statSync(path.join(tempDir, file)).isDirectory() &&
        (file.endsWith(".js") ||
          file.endsWith(".d.ts") ||
          file.endsWith(".js.map")),
    );

  console.log(`Found ${rootFiles.length} root files to process`);

  for (const file of rootFiles) {
    const sourcePath = path.join(tempDir, file);
    const targetPath = path.join(distDir, file);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to dist/`);
  }
} catch (error) {
  console.error("Error processing root files:", error);
}

// Process src files - move them up one level
const srcDir = path.join(tempDir, "src");
if (fs.existsSync(srcDir)) {
  console.log("Processing src directory...");

  try {
    const processDirectory = (sourceDir, targetDir) => {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const items = fs.readdirSync(sourceDir);

      for (const item of items) {
        const sourcePath = path.join(sourceDir, item);
        const targetPath = path.join(targetDir, item);

        if (fs.statSync(sourcePath).isDirectory()) {
          processDirectory(sourcePath, targetPath);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied ${sourcePath} to ${targetPath}`);
        }
      }
    };

    // Process each directory in src
    const srcItems = fs.readdirSync(srcDir);
    for (const item of srcItems) {
      const sourcePath = path.join(srcDir, item);
      const targetPath = path.join(distDir, item);

      if (fs.statSync(sourcePath).isDirectory()) {
        processDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${sourcePath} to ${targetPath}`);
      }
    }
  } catch (error) {
    console.error("Error processing src directory:", error);
  }
}

console.log("Files reorganized successfully");

// Fix import extensions in all files
function fixImportExtensions(directory) {
  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fixImportExtensions(filePath);
      } else if (file.endsWith(".js") || file.endsWith(".d.ts")) {
        let content = fs.readFileSync(filePath, "utf8");

        // Replace .ts extensions with .js in import/export statements
        const originalContent = content;
        content = content.replace(
          /from\s+['"]([^'"]+)\.ts['"]/g,
          'from "$1.js"',
        );
        content = content.replace(
          /import\s+['"]([^'"]+)\.ts['"]/g,
          'import "$1.js"',
        );
        content = content.replace(
          /export\s+.*from\s+['"]([^'"]+)\.ts['"]/g,
          (match, p1) => {
            return match.replace(`${p1}.ts`, `${p1}.js`);
          },
        );

        // Fix relative paths that might have been broken by the reorganization
        content = content.replace(/from\s+['"]\.\.\/src\//g, 'from "../');
        content = content.replace(/import\s+['"]\.\.\/src\//g, 'import "../');
        content = content.replace(
          /export\s+.*from\s+['"]\.\.\/src\//g,
          (match) => {
            return match.replace("../src/", "../");
          },
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          console.log(`Fixed imports in ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error fixing import extensions in ${directory}:`, error);
  }
}

try {
  fixImportExtensions(distDir);
  console.log("Import extensions fixed");
} catch (error) {
  console.error("Error during import extension fixing:", error);
}

// Clean up temp directory
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("Temporary directory cleaned up");
} catch (error) {
  console.error("Error cleaning up temp directory:", error);
}

console.log("Distribution processing completed successfully");
