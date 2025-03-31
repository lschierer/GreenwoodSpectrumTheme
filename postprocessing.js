// process-dist.js
// fix-imports.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");

console.log("Starting import path fixing...");

// Fix import extensions in all files
function fixImportPaths(directory) {
  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fixImportPaths(filePath);
      } else if (file.endsWith(".ts") || file.endsWith(".js")) {
        let content = fs.readFileSync(filePath, "utf8");
        let modified = false;

        // Replace .ts extensions with .js in import/export statements
        // But only if the consuming project will use JavaScript
        const newContent = content
          // Fix paths that reference src
          .replace(/from\s+['"]\.\.\/src\//g, (match) => {
            modified = true;
            return 'from "../';
          })
          .replace(/import\s+['"]\.\.\/src\//g, (match) => {
            modified = true;
            return 'import "../';
          })
          .replace(/export\s+.*from\s+['"]\.\.\/src\//g, (match) => {
            modified = true;
            return match.replace("../src/", "../");
          });

        if (modified) {
          fs.writeFileSync(filePath, newContent);
          console.log(`Fixed imports in ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

try {
  fixImportPaths(distDir);
  console.log("Import paths fixed successfully");
} catch (error) {
  console.error("Error during import path fixing:", error);
  process.exit(1);
}
