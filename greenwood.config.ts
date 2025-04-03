import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginImportRaw } from "@greenwood/plugin-import-raw";

import type { Config } from "@greenwood/cli";

import { greenwoodSpectrumThemePack } from "./src/greenwood-spectrum-theme.ts";
import { loadConfig, type Config as PackConfig } from "./src/lib/config.ts";
import localConfig from "./src/greenwood-spectrum-theme.config.ts";

const config = loadConfig(localConfig) as PackConfig;

export default {
  useTsc: true,
  activeContent: true,
  isolation: true,
  optimization: "default",
  prerender: false,
  staticRouter: false,
  markdown: {
    plugins: [
      "rehype-autolink-headings",
      "remark-alerts",
      "remark-gfm",
      "remark-rehype",
    ],
    settings: {
      commonmark: true,
    },
  },
  plugins: [
    greenwoodPluginImportRaw(),
    greenwoodSpectrumThemePack(config),

    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
} as Config;
