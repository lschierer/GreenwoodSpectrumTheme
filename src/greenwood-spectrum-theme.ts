import type {
  Compilation,
  SourcePlugin,
  AdapterPlugin,
  ContextPlugin,
  CopyPlugin,
  RendererPlugin,
  ResourcePlugin,
  RollupPlugin,
  ServerPlugin,
} from "@greenwood/cli";

import process from "node:process";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "url";

import { ExternalPluginFooterSection } from "./plugins/FooterSectionPlugin.ts";
import { TopHeaderSectionPlugin } from "./plugins/TopHeaderSectionPlugin.ts";
import { DirectoryIndexSourcePlugin } from "./plugins/DirectoryIndexPlugin.ts";
import { ExternalPluginSideBar } from "./plugins/SideBarPlugin.ts";
import { ComponentResorcePluginProvider } from "./plugins/ComponentResourcePlugin.ts";

import { Config } from "./lib/config.ts";
import debugFunction from "./lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

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

      const parentDir = basename(dirname(fileURLToPath(import.meta.url)));

      const layoutLocation =
        env === "development"
          ? parentDir === "dist"
            ? new URL(`./layouts/`, import.meta.url)
            : new URL("./layouts/", compilation.context.userWorkspace)
          : new URL(`./layouts/`, import.meta.url);
      if (DEBUG) {
        console.log(`layoutLocation for spectrum-theme is ${layoutLocation}`);
      }

      const context = {
        layouts: [layoutLocation],
      };
      return context;
    },
  };
  return cp;
};

export const greenwoodSpectrumThemePack = (options: Config) => {
  const valid = Config.safeParse(options);
  if (!valid.success && DEBUG) {
    console.error(
      `invalid options for greenwoodSpectrumThemePack: `,
      valid.error.message,
    );
  }
  const pa = new Array<
    | SourcePlugin
    | AdapterPlugin
    | ContextPlugin
    | CopyPlugin
    | RendererPlugin
    | ResourcePlugin
    | RollupPlugin
    | ServerPlugin
  >();
  pa.push(...ExternalPluginSideBar(options));
  pa.push(...ExternalPluginFooterSection(options));
  pa.push(TopHeaderSectionPlugin(options));
  pa.push(DirectoryIndexSourcePlugin());
  pa.push(ComponentResorcePluginProvider(options));
  pa.push(SpectrumContextPlugin());

  return pa;
};
