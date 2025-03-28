import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import type { Config } from "@greenwood/cli";

//import { FooterCopyrightSection } from "./src/plugins/FooterSectionPlugin.ts";
import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndexPlugin.ts";

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
    //FooterCopyrightSectionPlugin(),
    DirectoryIndexSourcePlugin(),
    /*{
      type: "resource",
      name: "footer-copyright-section",
      provider: (compilation) => new FooterCopyrightSection(compilation, {}),
    },*/
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
} as Config;
