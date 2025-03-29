import git from "isomorphic-git";
import fs from "node:fs";
import process from "node:process";
import { JSDOM } from "jsdom";

import type { Compilation, Resource, ResourcePlugin } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
import { type Config } from "../lib/config.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

class FooterSectionResource implements Resource {
  private compilation: Compilation;
  private options: Config;
  private repo = process.cwd();

  private contentType;

  constructor(compilation: Compilation, options: Config) {
    this.compilation = compilation;
    this.options = options;

    this.contentType = "text/html";
  }

  async shouldIntercept(url: URL, request: Request, response: Response) {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */

    const responseContentType = response.headers.get("Content-Type");
    if (responseContentType) {
      return (
        responseContentType.indexOf(this.contentType) >= 0 &&
        !url.pathname.startsWith("/api/")
      );
    }
    return false;
  }

  async intercept(url: URL, request: Request, response: Response) {
    let body = await response.text();

    const dom = new JSDOM(body);
    const document = dom.window.document;
    const footerCopyrightElement = document.querySelector("#copyright");
    if (footerCopyrightElement) {
      if (DEBUG) {
        console.log(`found footerCopyrightElement for ${url.pathname}`);
      }
      const authors: string | string[] = await this.getAuthors();
      const firstYear = await this.getFirstYear();
      const today = new Date();
      if (firstYear.getFullYear() == today.getFullYear()) {
        footerCopyrightElement.textContent = `©${today.getFullYear()} ${Array.isArray(authors) ? authors.map((a: string) => a).join(", ") : authors}`;
      } else {
        footerCopyrightElement.textContent = `©${firstYear.getFullYear()} - ${today.getFullYear()} ${Array.isArray(authors) ? authors.map((a: string) => a).join(", ") : authors}`;
      }
      body = dom.serialize();
    } else {
      if (DEBUG) {
        console.log(`no footerCopyrightElement for ${url.pathname}`);
      }
      if (DEBUG && url.pathname.startsWith("/testDir")) {
        console.log(body);
      }
    }

    body = dom.serialize();
    return new Response(body, {
      headers: response.headers,
    });
  }

  protected getFirstYear = async () => {
    if (DEBUG) {
      console.log(`start of getFirstYear`);
    }
    let firstYear = new Date();
    await git
      .log({
        fs,
        dir: this.repo,
        follow: true,
      })
      .catch((error: unknown) => {
        if (DEBUG) {
          console.error(`Error getting commit history: `, error);
        }
      })
      .then((gitlog) => {
        if (gitlog) {
          for (const entry of gitlog) {
            const EntryDate = new Date(entry.commit.author.timestamp * 1000);
            const EntryYear = EntryDate.getFullYear();
            if (EntryYear < firstYear.getFullYear()) {
              firstYear = EntryDate;
            }
          }
        }
      });
    return firstYear;
  };

  protected getAuthors = async () => {
    if (DEBUG) {
      console.log(`start of getAuthors`);
    }
    const repoAuthors = new Set<string>();
    if (Array.isArray(this.options.authors)) {
      for (const author of this.options.authors) {
        repoAuthors.add(author);
      }
    } else {
      await git
        .log({
          fs,
          dir: this.repo,
          follow: true,
        })
        .catch((error: unknown) => {
          if (DEBUG) {
            console.error(`Error getting commit history: `, error);
          }
        })
        .then((gitlog) => {
          if (gitlog) {
            for (const entry of gitlog) {
              repoAuthors.add(entry.commit.author.name);
            }
          }
        });
    }

    return [...repoAuthors];
  };
}

/* this will infinitally hang greenwood with no console output
const ExternalPluginFooterSection = (options = {}): ResourcePlugin => {
  return {
    type: "resource",
    name: "external-plugin-footersecton",
    provider: (compilation) => new FooterSectionResource(compilation, options),
  };
};
*/

//This version differs only in that it wraps the return in an array. it works fine.
const ExternalPluginFooterSection = (options: Config): ResourcePlugin[] => {
  return [
    {
      type: "resource",
      name: "external-plugin-footersecton",
      provider: (compilation) =>
        new FooterSectionResource(compilation, options),
    },
  ];
};

export { ExternalPluginFooterSection };
