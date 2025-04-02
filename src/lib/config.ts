import { z } from "zod";

import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export const Config = z.object({
  moduleName: z
    .string()
    .min(3)
    .describe(
      "this must conform to https://docs.npmjs.com/creating-a-package-json-file#required-name-and-version-fields *and* must be a valid filename on the file system (ie not a scoped package name with slashes) ",
    ),
  siteTitle: z
    .string()
    .min(3)
    .describe(
      "this is a human-consuable string that will be used as the title on the default landing page and in the top Header)",
    ),
  siteLogo: z
    .string()
    .optional()
    .describe(
      'this should contain the path, including the filename, to the logo file rooted in the Greenwood assets directory. If your asset directory is $assetDir, and your logo file is `$assetDir/myLogo.svg` then you would put "myLogo.svg" here. ',
    ),
  siteLogoAltText: z
    .string()
    .optional()
    .describe("any alt text that should be used for the logo image."),
  topLevelSections: z
    .string()
    .array()
    .describe(
      "this should contain an array of strings that will form the main/top level sections for the site.  Thesse will appear in the top navigation section as well as the side navigations section.",
    ),
  privacyPolicy: z
    .union([z.string(), z.literal("false"), z.literal(false)])
    .describe(
      "a path, within the site, to the privacy policy, or false to indicate no policy is present for this site.",
    ),
  authors: z
    .union([z.literal("git"), z.string().array()])
    .describe(
      'either an array of strings, with each string being an author of the site, or the single string constant "git" to indicate that the authors should be extracted from git.',
    ),
  repo: z.string().url().describe("the URL of your git repository"),
  branch: z
    .string()
    .default("main")
    .optional()
    .describe('the branch of the repository if not "main"'),
});
export type Config = z.infer<typeof Config>;

export function loadConfig(localConfig: object = {}): Config | undefined {
  if (DEBUG) {
    console.log(`loadConfig start`);
  }

  const valid = Config.safeParse(localConfig);
  if (valid.success) {
    return valid.data;
  } else {
    console.error(valid.error.message);
    throw new Error("Invalid config");
  }
}
