import { type Config, loadConfig } from "./config.ts";

const result = (await loadConfig()) as Config;

export const config = result;
