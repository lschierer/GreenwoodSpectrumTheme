import git from "isomorphic-git";
import fs from "node:fs";
//import http from "isomorphic-git/http/web/index.js";
//import http from "isomorphic-git/http/node/index.js";

import process from "node:process";

import type { Compilation, Resource } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.log(`DEBUG is ${DEBUG} in ${new URL(import.meta.url).pathname}`);

import { config } from "../lib/config.ts";

//const fs: FS = new FS("authors");

export class FooterCopyrightSection implements Resource {
  private compilation: Compilation;
  private options: object;
  private repo = process.cwd();

  constructor(compilation: Compilation, options: object) {
    if (DEBUG) {
      console.log(`FooterCopyrightSection constructor`);
    }
    this.compilation = compilation;
    this.options = options;
  }

  getFirstYear = async () => {
    if (DEBUG) {
      console.log(`start of getFirstYear`);
    }
    let firstYear = new Date("2020");
    await git
      .log({
        fs,
        dir: this.repo,
        follow: true,
      })
      .catch((error: unknown) => {
        if (DEBUG) {
          console.error("Error getting commit history: ", error);
        }
      })
      .then((gitlog) => {
        if (gitlog) {
          for (const logEntry of gitlog) {
            const EntryDate = new Date(logEntry.commit.author.timestamp * 1000);
            const EntryYear = EntryDate.getFullYear();
            if (EntryYear < firstYear.getFullYear()) {
              firstYear = EntryDate;
            }
          }
        }
      });
    return firstYear;
  };

  getAuthors = async () => {
    if (DEBUG) {
      console.log(`start of getAuthors`);
    }
    const authors = new Set<string>();

    if (Array.isArray(config.authors)) {
      for (const author of config.authors) {
        authors.add(author);
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
            console.error("Error getting commit history: ", error);
          }
        })
        .then((gitlog) => {
          if (gitlog) {
            for (const logEntry of gitlog) {
              authors.add(logEntry.commit.author.name);
            }
          }
        });
    }
    return [...authors];
  };

  async shouldPreIntercept(url: URL) {
    if (DEBUG) {
      console.log(
        `FooterCopyrightSection shouldPreIntercept for ${url.pathname}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
    return (
      !url.pathname.startsWith("/api") && !url.pathname.startsWith("/assets")
    );
  }

  async preIntercept(url: URL, request: Request, response: Response) {
    if (DEBUG) {
      console.log(`FooterCopyrightSection preIntercept for ${url.pathname}`);
    }
    const body = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    let content = "";

    const footerCopyrightElement = doc.querySelector("#copyright.copyright");
    if (footerCopyrightElement) {
      const authors: string | string[] = ""; //await this.getAuthors();
      const firstYear = new Date(2020); //await this.getFirstYear();
      const today = new Date();
      footerCopyrightElement.textContent = `©${firstYear.getFullYear()} - ${today.getFullYear()} ${Array.isArray(authors) ? authors.map((a: string) => a).join(", ") : authors}`;
      const serializer = new XMLSerializer();
      content = serializer.serializeToString(doc);
    } else {
      content = body;
    }

    return new Response(content, {
      headers: response.headers,
    });
  }
}

export const FooterCopyrightSectionPlugin = (options = {}) => {
  return {
    type: "resource",
    name: "footer-copyright-section",
    provider: (compilation: Compilation) =>
      new FooterCopyrightSection(compilation, options),
  };
};
