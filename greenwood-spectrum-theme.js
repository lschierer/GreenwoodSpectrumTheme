import process from "node:process";
import { ExternalPluginFooterSection } from "./src/plugins/FooterSectionPlugin.js";
import { DirectoryIndexSourcePlugin } from "./src/plugins/DirectoryIndexPlugin.js";
import { ExternalPluginSideBar } from "./src/plugins/SideBarPlugin.js";
export const SpectrumContextPlugin = () => {
    const cp = {
        type: "context",
        name: "spectrum-theme-pack:context",
        provider: (compilation) => {
            // you can use other directory names besides layouts/ this way!
            const env = process.env.__GWD_COMMAND__ === "develop"
                ? "development"
                : "production";
            const layoutLocation = env === "development"
                ? new URL("./layouts/", compilation.context.userWorkspace)
                : new URL("dist/layouts/", import.meta.url);
            return {
                layouts: [layoutLocation],
            };
        },
    };
    return cp;
};
export const greenwoodSpectrumThemePack = (options) => {
    const pa = new Array();
    pa.push(...ExternalPluginSideBar(options));
    pa.push(...ExternalPluginFooterSection(options));
    pa.push(SpectrumContextPlugin());
    pa.push(DirectoryIndexSourcePlugin());
    return pa;
};
//# sourceMappingURL=greenwood-spectrum-theme.js.map