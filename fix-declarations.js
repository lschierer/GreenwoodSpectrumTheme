// fix-declarations.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixImportExtensions(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixImportExtensions(filePath);
    } else if (file.endsWith(".d.ts")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Replace .ts extensions with .js in import statements
      content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from "$1.js"');

      fs.writeFileSync(filePath, content);
    }
  }
}

fixImportExtensions(path.join(__dirname, "dist"));
console.log("Fixed declaration file import extensions");
