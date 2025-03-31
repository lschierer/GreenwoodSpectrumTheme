import type { ContextPlugin, Compilation, Plugin } from "@greenwood/cli";

import process from "node:process";

import { ExternalPluginFooterSection } from "./src/plugins/FooterSectionPlugin.ts";
import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndexPlugin.ts";
import { ExternalPluginSideBar } from "./src/plugins/SideBarPlugin.ts";

import { type Config } from "./src/lib/config.ts";

export const SpectrumContextPlugin = () => {
  const cp: ContextPlugin = {
    type: "context",
    name: "spectrum-theme-pack:context",
    provider: (compilation: Compilation) => {
      // you can use other directory names besides layouts/ this way!
      const env =
        process.env.__GWD_COMMAND__ === "develop"
          ? "development"
          : "production";

      const layoutLocation =
        env === "development"
          ? new URL("./layouts/", compilation.context.userWorkspace)
          : new URL("dist/layouts/", import.meta.url);

      return {
        layouts: [layoutLocation],
      };
    },
  };
  return cp;
};

export const greenwoodSpectrumThemePack = (options: Config) => {
  const pa: Plugin[] = new Array<Plugin>();
  pa.push(SpectrumContextPlugin());
  pa.push(DirectoryIndexSourcePlugin());
  pa.push(...ExternalPluginSideBar(options));
  pa.push(...ExternalPluginFooterSection(options));

  return pa;
};
