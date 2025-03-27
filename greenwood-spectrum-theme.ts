import type { ContextPlugin, Compilation } from "@greenwood/cli";

import process from "node:process";

export const greenwoodSpectrumThemePack = (): ContextPlugin => {
  const env =
    process.env.__GWD_COMMAND__ === "develop" ? "development" : "production";
  return {
    type: "context",
    provider: (compilation: Compilation): { layouts: URL[] } => {
      const layouts: URL[] = new Array<URL>();

      let layoutLocation: URL = new URL(import.meta.url);
      if (!env.localeCompare("development")) {
        layoutLocation = new URL(
          "./layouts/",
          compilation.context.userWorkspace,
        );
      } else {
        layoutLocation = new URL("dist/layouts/", import.meta.url);
      }
      layouts.push(layoutLocation);

      return { layouts };
    },
  };
};
