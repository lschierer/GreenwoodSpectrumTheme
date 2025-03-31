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

// Process root files
const rootFiles = fs
  .readdirSync(tempDir)
  .filter(
    (file) =>
      !file.startsWith("src") &&
      (file.endsWith(".js") ||
        file.endsWith(".d.ts") ||
        file.endsWith(".js.map")),
  );

for (const file of rootFiles) {
  fs.copyFileSync(path.join(tempDir, file), path.join(distDir, file));
}

// Process src files - move them up one level
const srcDir = path.join(tempDir, "src");
if (fs.existsSync(srcDir)) {
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
    }
  }
}

console.log("Files reorganized successfully");

// Fix import extensions in all files
function fixImportExtensions(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixImportExtensions(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".d.ts")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Replace .ts extensions with .js in import/export statements
      content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from "$1.js"');
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
      // For example, "../src/lib/something" should become "../lib/something"
      content = content.replace(/from\s+['"]\.\.\/src\//g, 'from "../');
      content = content.replace(/import\s+['"]\.\.\/src\//g, 'import "../');
      content = content.replace(
        /export\s+.*from\s+['"]\.\.\/src\//g,
        (match) => {
          return match.replace("../src/", "../");
        },
      );

      fs.writeFileSync(filePath, content);
    }
  }
}

fixImportExtensions(distDir);
console.log("Import extensions fixed");

// Clean up temp directory
fs.rmSync(path.join(distDir, "temp"), { recursive: true, force: true });

console.log("Distribution processing completed successfully");
