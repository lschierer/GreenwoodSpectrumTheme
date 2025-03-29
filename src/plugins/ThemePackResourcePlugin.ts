import fs from "fs";
import type { Compilation, Resource } from "@greenwood/cli";

const packageDotJson = JSON.parse(
  fs.readFileSync("./package.json", "utf-8"),
) as object;

const packageName = packageDotJson[
  "name" as keyof typeof packageDotJson
] as string;

export class MyThemePackDevelopmentResource implements Resource {
  extensions = new Array<string>();
  private compilation: Compilation;
  private options: object;

  constructor(compilation: Compilation, options: object) {
    this.extensions.push("*");
    this.compilation = compilation;
    this.options = options;
  }

  async shouldResolve(url: URL) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    return (
      process.env.__GWD_COMMAND__ === "develop" &&
      url.pathname.indexOf(`/node_modules/${packageName}/`) >= 0
    );
  }

  async resolve(url: URL) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    const { userWorkspace } = this.compilation.context;
    const { pathname, searchParams } = url;
    const workspaceUrl = pathname.split(
      `/node_modules/${packageName}/dist/`,
    )[1];
    const params = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    return new Request(new URL(`./${workspaceUrl}${params}`, userWorkspace));
  }
}
