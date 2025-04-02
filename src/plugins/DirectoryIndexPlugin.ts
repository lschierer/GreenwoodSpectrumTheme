import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";

import * as fs from "fs";
import * as path from "node:path";

import debugFunction from "../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const getMissingIndexes = (): string[] => {
  // Use a Set to ensure uniqueness of paths
  const missingIndexesSet = new Set<string>();

  // Get the absolute path to the pages directory
  const pagesDir = path.resolve(process.cwd(), "src/pages");

  if (DEBUG) {
    console.log(`Checking for missing indexes in ${pagesDir}`);
  }

  // Helper function to recursively check directories
  const checkDirectory = (dirPath: string, relativePath: string = "") => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      // Check if this directory has an index file
      const hasIndex = entries.some(
        (entry) =>
          !entry.isDirectory() && /^index\.(html|ts|md)$/.test(entry.name),
      );

      // Only add non-root directories that don't have an index
      if (!hasIndex && relativePath) {
        // This directory doesn't have an index file
        missingIndexesSet.add(relativePath);
        if (DEBUG) {
          console.log(`Found directory without index: ${relativePath}`);
        }
      }

      // Recursively check subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const newRelativePath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
          checkDirectory(path.join(dirPath, entry.name), newRelativePath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  };

  // Start the recursive check from the pages directory
  checkDirectory(pagesDir);

  // Convert Set to Array before returning
  return Array.from(missingIndexesSet);
};
export const DirectoryIndexSourcePlugin = (): SourcePlugin => {
  return {
    type: "source",
    name: "source-plugin-external-directory-index-page",
    provider: (): (() => Promise<ExternalSourcePage[]>) => {
      return async function () {
        /*start work around for GetFrontmatter requiring async */
        await new Promise((resolve) => setTimeout(resolve, 1));
        /* end workaround */

        const returnPages = new Array<ExternalSourcePage>();

        const missingIndexes = getMissingIndexes();

        for (const missing of missingIndexes) {
          if (!missing.startsWith("api")) {
            const mr = `/${missing}/`;
            const baseTitle = path.basename(missing);
            const DIPath = import.meta.url.includes("/dist/")
              ? "/node_modules/greenwoodspectrumtheme/components/DirectoryIndex.js"
              : "/components/DirectoryIndex.ts";
            const index: ExternalSourcePage = {
              title: baseTitle,
              label: baseTitle,
              id: baseTitle,
              route: mr,
              layout: "standard",
              imports: [`${DIPath} type="module"`],
              body: `
                <directory-index directory="${mr}"></directory-index>
              `,
            };
            if (DEBUG) {
              console.log(`created page ${mr}\n`, index);
            }
            returnPages.push(index);
          }
        }

        return returnPages;
      };
    },
  };
};
