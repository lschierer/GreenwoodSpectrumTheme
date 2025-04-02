import path from "path";
import { fileURLToPath } from "url";
import process from "node:process";
import { basename, dirname } from "node:path";

import type { Resource, ResourcePlugin, Compilation } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG for ${new URL(import.meta.url).pathname} is ${DEBUG}`);
}

export class ComponentResource implements Resource {
  private compilation: Compilation;
  private options: object;
  private componentsDirs: string[] = new Array<string>();

  constructor(compilation: Compilation, options: object) {
    this.compilation = compilation;
    this.options = options;

    if (Object.keys(this.compilation.context).includes("components")) {
      const componentDirs =
        this.compilation.context[
          "components" as keyof typeof this.compilation.context
        ];
      if (Array.isArray(componentDirs)) {
        for (const cDir of componentDirs) {
          const p = path.resolve(fileURLToPath(cDir as URL));
          this.componentsDirs.push(p);
        }
      } else {
        const p = path.resolve(fileURLToPath(componentDirs));
        this.componentsDirs.push(p);
      }
    }
  }

  async shouldResolve(url: URL) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    const pathname = new URL(url, import.meta.url).pathname;

    if (pathname.includes("greenwoodspectrumtheme")) {
      if (DEBUG) {
        console.log(
          `ComponentResource shouldResolve detects path containing greenwoodspectrumtheme`,
        );
      }
      // Check for all resource types from your theme
      if (
        pathname.includes("/components/") ||
        pathname.includes("/lib/") ||
        pathname.includes("/styles/") ||
        pathname.includes("/layouts/")
      ) {
        if (DEBUG) {
          console.log(
            `ComponentResource shouldResolve detects resource path `,
            `returning true for ${url.pathname}`,
          );
        }

        return true;
      }
    }
    return false;
  }

  async resolve(url: URL) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    const { pathname, searchParams } = url;

    const env =
      process.env.__GWD_COMMAND__ === "develop" ? "development" : "production";

    if (DEBUG) {
      console.log(`url is ${url}`);
    }
    const urlPath = pathname;
    let relativePath = urlPath.split("/").slice(3).join("/");
    if (
      relativePath.startsWith("node_modules/greenwoodspectrumtheme/") &&
      !relativePath.includes("/dist")
    ) {
      relativePath = relativePath.replace(
        "node_modules/greenwoodspectrumtheme/",
        "",
      );
    }
    if (DEBUG) {
      console.log(`relativePath is ${relativePath}`);
    }

    const parentDir = dirname(fileURLToPath(import.meta.url));
    const grandParentDir = basename(dirname(parentDir));
    if (DEBUG) {
      console.log(
        `import.meta.url is ${import.meta.url};\nparentDir is ${parentDir}`,
      );
    }

    const params = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    let workspaceRoot: URL | string = "";
    let componentsURL: URL | string = "";
    if (env === "development") {
      if (grandParentDir === "dist") {
        if (DEBUG) {
          console.log(`dev mode with grandparent dist`);
        }
        workspaceRoot = grandParentDir;
        if (!pathname.includes("plugins")) {
          componentsURL = new URL(
            `../${relativePath}${params}`,
            import.meta.url,
          );
        } else {
          componentsURL = new URL(
            `./${workspaceRoot}/${relativePath}${params}`,
            import.meta.url,
          );
        }
      } else {
        if (DEBUG) {
          console.log(
            `dev mode with grandparent dir ${grandParentDir} and parent ${parentDir}`,
          );
        }
        workspaceRoot = this.compilation.context.userWorkspace;
        if (!pathname.includes("plugins")) {
          componentsURL = new URL(
            `../${workspaceRoot}/${relativePath}${params}`,
            this.compilation.context.userWorkspace,
          );
        } else {
          componentsURL = new URL(
            `./${workspaceRoot}/${relativePath}${params}`,
            this.compilation.context.userWorkspace,
          );
        }
      }
    } else {
      if (!pathname.includes("plugins")) {
        componentsURL = new URL(
          `../${workspaceRoot}/${relativePath}${params}`,
          url,
        );
      } else {
        componentsURL = new URL(
          `./${workspaceRoot}/${relativePath}${params}`,
          url,
        );
      }
    }

    if (DEBUG) {
      console.log(`workspaceRoot is ${workspaceRoot}`);
      console.log(`componentsURL is ${componentsURL.toString()}`);
    }
    return new Request(componentsURL);
  }
}

export const ComponentResorcePluginProvider = (
  options = {},
): ResourcePlugin => {
  const rp: ResourcePlugin = {
    type: "resource",
    name: "greenwood-spectrum-theme-plugin:component-resource",
    provider: (compilation) => new ComponentResource(compilation, options),
  };
  return rp;
};
