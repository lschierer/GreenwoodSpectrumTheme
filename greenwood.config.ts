import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import type { Config } from "@greenwood/cli";

import { greenwoodSpectrumThemePack } from "./src/greenwood-spectrum-theme.ts";
import { loadConfig } from "./src/lib/config.ts";
const localConfig = "../greenwood-spectrum-theme.config.ts";

const config = await loadConfig(localConfig);

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
