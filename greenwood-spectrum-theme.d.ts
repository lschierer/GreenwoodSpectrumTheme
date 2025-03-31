import type { ContextPlugin, Plugin } from "@greenwood/cli";
import { type Config } from "./src/lib/config.ts";
export declare const SpectrumContextPlugin: () => ContextPlugin;
export declare const greenwoodSpectrumThemePack: (options: Config) => Plugin[];
