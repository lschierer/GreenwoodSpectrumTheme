import git from "isomorphic-git";
import fs from "node:fs";
import process from "node:process";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element } from "hast";

import type { Compilation, Resource, ResourcePlugin } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
import { Config } from "../lib/config.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

class FooterSectionResource implements Resource {
  private compilation: Compilation;
  private options: Config | undefined = undefined;
  private repo = process.cwd();

  private contentType;

  constructor(compilation: Compilation, options: object) {
    this.compilation = compilation;
    const valid = Config.safeParse(options);
    if (valid.success) {
      this.options = valid.data;
    }

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
    const body = await response.text();
    const authors = await this.getAuthors();
    const firstYear = await this.getFirstYear();
    const today = new Date();

    let copyrightText;
    if (firstYear.getFullYear() == today.getFullYear()) {
      copyrightText = `©${today.getFullYear()} ${Array.isArray(authors) ? authors.map((a: string) => a).join(", ") : authors}`;
    } else {
      copyrightText = `©${firstYear.getFullYear()} - ${today.getFullYear()} ${Array.isArray(authors) ? authors.map((a: string) => a).join(", ") : authors}`;
    }

    // Process HTML with unified/rehype
    const file = await unified()
      .use(rehypeParse, { fragment: false })
      .use(() => (tree) => {
        visit(tree, "element", (node: Element) => {
          if (
            node.tagName === "div" &&
            node.properties.className &&
            Array.isArray(node.properties.className) &&
            node.properties.className.includes("footer")
          ) {
            const tempTree = unified()
              .use(rehypeParse, { fragment: true })
              .parse(this.getPrivacyPolicy());
            const en = tempTree.children.filter(
              (child) => child.type === "element",
            );
            node.children = en;
          }
        });
        visit(tree, "element", (node: Element) => {
          if ("id" in node.properties && node.properties.id === "copyright") {
            if (DEBUG) {
              console.log(`found footerCopyrightElement for ${url.pathname}`);
            }
            // Clear existing children and add new text node
            node.children = [
              {
                type: "text",
                value: copyrightText,
              },
            ];
          }
        });
      })
      .use(rehypeStringify)
      .process(body);

    return new Response(String(file), {
      headers: response.headers,
    });
  }

  protected getPrivacyPolicy = () => {
    if (this.options && this.options.privacyPolicy) {
      return `
        <span class="privacy spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light">
          <a href="${this.options.privacyPolicy}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--primary">
            Privacy Policy
          </a>
        </span>
      `;
    } else {
      return "";
    }
  };
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
        // Return empty array to handle the error case properly
        return [];
      })
      .then((gitlog) => {
        if (gitlog.length) {
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
    if (this.options && Array.isArray(this.options.authors)) {
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
          if (gitlog?.length) {
            for (const entry of gitlog) {
              repoAuthors.add(entry.commit.author.name);
            }
          }
        });
    }

    return [...repoAuthors];
  };
}

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
