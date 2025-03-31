import type { ContextPlugin, Compilation, Plugin } from "@greenwood/cli";

import process from "node:process";

import { ExternalPluginFooterSection } from "./src/plugins/FooterSectionPlugin.ts";
import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndexPlugin.ts";
import { ExternalPluginSideBar } from "./src/plugins/SideBarPlugin.ts";

import { type Config } from "./src/lib/config.ts";

const SpectrumContextPlugin = (): ContextPlugin | ContextPlugin[] => {
  const env =
    process.env.__GWD_COMMAND__ === "develop" ? "development" : "production";
  return [
    {
      type: "context",
      provider: (compilation: Compilation): { layouts: URL[] } => {
        const layouts: URL[] = new Array<URL>();

        let layoutLocation: URL = new URL(import.meta.url);
        if (!env.localeCompare("development")) {
          layoutLocation = new URL(
            "./src/layouts/",
            compilation.context.userWorkspace,
          );
        } else {
          layoutLocation = new URL("dist/layouts/", import.meta.url);
        }
        layouts.push(layoutLocation);

        return { layouts };
      },
    },
  ] as ContextPlugin[];
};

export const greenwoodSpectrumThemePack = (options: Config) => {
  return [
    DirectoryIndexSourcePlugin(),
    ExternalPluginFooterSection(options),
    ExternalPluginSideBar(),
    SpectrumContextPlugin(),
  ];
};
