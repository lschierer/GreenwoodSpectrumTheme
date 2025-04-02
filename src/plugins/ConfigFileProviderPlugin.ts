import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";
import { Config } from "../lib/config.ts"; // Zod schema
import debugFunction from "../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export const ThemeConfigSourcePagePlugin = (
  userConfig: object,
): SourcePlugin => {
  return {
    type: "source",
    name: "greenwood-spectrum-theme:config-file",

    provider: (compilation) => {
      return async (): Promise<ExternalSourcePage[]> => {
        /*start work around for GetFrontmatter requiring async */
        await new Promise((resolve) => setTimeout(resolve, 1));
        /* end workaround */

        const result = Config.safeParse(userConfig);

        if (
          compilation.graph.find((page) => {
            return !page.route.localeCompare(
              "/api/greenwoodspectrumtheme/config",
            );
          })
        ) {
          console.error(`config api route already exists!!`);
        }

        if (!result.success) {
          if (DEBUG) {
            console.warn("Invalid config provided:", result.error);
          }

          return [
            {
              route: "/api/greenwoodspectrumtheme/config",
              title: "Config Not Found",
              id: "config-404",
              body: `
                <head>
                  <meta http-equiv="refresh" content="0; url=/404/">
                </head>
                <body>
                  Config not valid. Redirecting...
                </body>
              `,
            },
          ];
        }

        return [
          {
            route: "/api/greenwoodspectrumtheme/config",
            title: "Greenwood Spectrum Theme Config",
            id: "greenwood-spectrum-theme-config",
            body: JSON.stringify(result.data, null, 2),
          },
        ];
      };
    },
  };
};
