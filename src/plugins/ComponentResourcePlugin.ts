import path from "path";
import { fileURLToPath } from "url";
import process from "node:process";
import { basename, dirname } from "node:path";

import type { Resource, ResourcePlugin, Compilation } from "@greenwood/cli";

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
      console.log(
        `ComponentResource shouldResolve detects path containing greenwoodspectrumtheme`,
      );
      if (pathname.includes("/components/")) {
        console.log(
          `ComponentResource shouldResolve detects path containing components`,
        );
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

    const parentDir = basename(dirname(fileURLToPath(import.meta.url)));
    const componentName = basename(fileURLToPath(url));

    console.log(`componentName is ${componentName}`);

    const componentsLocation =
      env === "development"
        ? parentDir === "dist"
          ? new URL(`./components/`, import.meta.url)
          : new URL("./src/components/", this.compilation.context.userWorkspace)
        : new URL(`./components/`, import.meta.url);

    console.log(`componentsLocation is ${componentsLocation}`);

    const workspaceUrl = pathname.split(`/node_modules/${parentDir}/dist/`)[1];

    console.log(`workspaceUrl is ${workspaceUrl}`);

    const params = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    const componentsURL =
      env === "development"
        ? parentDir === "dist"
          ? new URL(`../components/${componentName}`, import.meta.url)
          : new URL(
              `/components/${componentName}${params}`, // Use absolute path starting with /
              this.compilation.context.userWorkspace,
            )
        : new URL(`../components/${componentName}`, import.meta.url);
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
