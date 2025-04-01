import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import type { Config } from "@greenwood/cli";

import { greenwoodSpectrumThemePack } from "./greenwood-spectrum-theme.ts";
//import { loadConfig } from "./src/lib/config.ts";
import { config } from "./src/lib/staticConfig.ts";

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
    greenwoodSpectrumThemePack(config),

    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
} as Config;
