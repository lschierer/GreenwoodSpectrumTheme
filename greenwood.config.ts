import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";

import type { Config } from "@greenwood/cli";

import { ExternalPluginFooterSection } from "./src/plugins/FooterSectionPlugin.ts";
import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndexPlugin.ts";
import { ExternalPluginSideBar } from "./src/plugins/SideBarPlugin.ts";

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
    ExternalPluginFooterSection(),
    DirectoryIndexSourcePlugin(),

    ExternalPluginSideBar(),
    greenwoodPluginPostCss({
      extendConfig: true,
    }),
  ],
} as Config;
