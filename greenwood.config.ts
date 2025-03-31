import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import type { Compilation, Config } from "@greenwood/cli";

import { greenwoodSpectrumThemePack } from "./greenwood-spectrum-theme.ts";
//import { loadConfig } from "./src/lib/config.ts";
import { SpectrumThemePackResource } from "./src/plugins/ThemePackResourcePlugin.ts";
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
    {
      type: "resource",
      name: "my-theme-pack:resource",
      provider: (compilation: Compilation, options: object) =>
        new SpectrumThemePackResource(compilation, options),
    },
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
} as Config;
