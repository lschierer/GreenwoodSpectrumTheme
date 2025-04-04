import git from "isomorphic-git";
import { type ReadCommitResult } from "isomorphic-git";
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
      if (this.options.repo.length) {
        if (this.options.repo.startsWith("file://")) {
          this.repo = this.options.repo.replace("file://", "");
        }
      }
      if (DEBUG) {
        console.log(`this.options.repo is ${this.options.repo}`);
        console.log(`this.repo is ${this.repo}`);
      }
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
            node.tagName === "footer" &&
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
            node.children.push(...en);
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

  // Shared method to get commits from all branches
  protected async getAllCommits(): Promise<ReadCommitResult[]> {
    if (DEBUG) {
      console.log(`Getting all commits from repository: ${this.repo}`);
    }

    const allCommits: Array<ReadCommitResult> = [];

    try {
      // First, get all branches
      const branches = await git.listBranches({
        fs,
        dir: this.repo,
      });

      if (DEBUG) {
        console.log(`Found branches: ${branches.join(", ")}`);
      }

      // Collect commits from all branches
      for (const branch of branches) {
        try {
          const branchCommits = await git.log({
            fs,
            dir: this.repo,
            ref: branch,
            depth: 500, // Increase depth to get more history
          });

          if (branchCommits.length) {
            allCommits.push(...branchCommits);
          }
        } catch (error) {
          console.warn(
            `Error getting commit history for branch ${branch}:`,
            error,
          );
        }
      }

      // Also try to get all commits using HEAD
      try {
        const headCommits = await git.log({
          fs,
          dir: this.repo,
          ref: "HEAD",
          depth: 1000,
        });

        if (headCommits.length) {
          allCommits.push(...headCommits);
        }
      } catch (error) {
        console.warn(`Error getting all commit history:`, error);
      }
    } catch (error: unknown) {
      if (DEBUG) {
        console.error(`Error getting commit history: `, error);
      }
    }

    // Remove duplicate commits by commit hash
    const uniqueCommits = new Map<string, ReadCommitResult>();
    for (const commit of allCommits) {
      if (!uniqueCommits.has(commit.oid)) {
        uniqueCommits.set(commit.oid, commit);
      }
    }

    return Array.from(uniqueCommits.values());
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

    const commits = await this.getAllCommits();

    for (const entry of commits) {
      const entryDate = new Date(entry.commit.author.timestamp * 1000);
      if (entryDate < firstYear) {
        firstYear = entryDate;
      }
    }

    return firstYear;
  };

  protected getAuthors = async () => {
    if (DEBUG) {
      console.log(`start of getAuthors`);
    }
    const repoAuthors = new Set<string>();

    if (
      this.options &&
      this.options.authors !== "git" &&
      Array.isArray(this.options.authors)
    ) {
      for (const author of this.options.authors) {
        repoAuthors.add(author);
      }
    } else {
      const commits = await this.getAllCommits();

      for (const entry of commits) {
        if (typeof entry.commit.author.name === "string") {
          repoAuthors.add(entry.commit.author.name);
        }
      }
    }

    if (DEBUG) {
      console.log(`Found authors: ${[...repoAuthors].join(", ")}`);
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
