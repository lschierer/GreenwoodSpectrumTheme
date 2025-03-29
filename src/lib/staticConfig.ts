import { loadConfig } from "./config.ts";

const result = await loadConfig();

export const config = Object.freeze(result);
