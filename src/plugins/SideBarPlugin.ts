import debugFunction from "../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import type {
  Compilation,
  Resource,
  Page,
  ResourcePlugin,
} from "@greenwood/cli";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element } from "hast";

type SideBarNode = Pick<Page, "id"> &
  Partial<Page> & {
    children: SideBarNode[];
    fullPath: string; // Full path to uniquely identify nodes
    isActualPage?: boolean; // Flag to indicate if this is an actual page vs just a route segment
  };

class SideBarResource implements Resource {
  private compilation: Compilation;
  private options: object;
  private contentType;

  constructor(compilation: Compilation, options: object = {}) {
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
    const body = await response.text();
    const rootNode = this.buildRouteTree(this.compilation.graph);
    const sidebarHtml = this.generateSidebarHTML(rootNode, url.pathname);

    // Process HTML with unified/rehype
    const file = await unified()
      .use(rehypeParse, { fragment: false }) // Parse as full document
      .use(() => (tree) => {
        // Custom plugin to update sidebar element
        visit(tree, "element", (node: Element) => {
          if (
            node.tagName === "div" &&
            node.properties.className &&
            Array.isArray(node.properties.className) &&
            node.properties.className.includes("nav")
          ) {
            // Create element nodes from the sidebar HTML string
            const tempTree = unified()
              .use(rehypeParse, { fragment: true })
              .parse(sidebarHtml);

            // Filter out any non-element content to ensure type compatibility
            const elementNodes = tempTree.children.filter(
              (child) => child.type === "element",
            );

            // Replace the node's children with the sidebar content
            node.children = elementNodes;
          }
        });

        // Add required CSS and script to head
        visit(tree, "element", (node: Element) => {
          if (node.tagName === "head") {
            // Add Spectrum CSS for sidenav
            node.children.push({
              type: "element",
              tagName: "link",
              properties: {
                href: "/node_modules/@spectrum-css/sidenav/dist/index.css",
                rel: "stylesheet",
              },
              children: [],
            });

            // Add local sidebar CSS
            node.children.push({
              type: "element",
              tagName: "link",
              properties: {
                href: "/styles/sidebar.css",
                rel: "stylesheet",
              },
              children: [],
            });
          }
        });
      })
      .use(rehypeStringify)
      .process(body);

    return new Response(String(file), {
      headers: response.headers,
    });
  }

  protected getNavTitle = (page: Page) => {
    if (page.title) {
      return page.title;
    } else if (page.label) {
      return page.label.replaceAll("_", " ");
    } else {
      const segment = page.route.split("/").pop();
      if (segment) {
        return segment.replaceAll("_", " ");
      }
      return "";
    }
  };

  protected buildRouteTree = (pages: Page[]): SideBarNode => {
    // First identify all actual page routes
    const pageRoutes = new Set<string>();
    const pathsInTree = new Set<string>();

    let root: SideBarNode = {
      id: "/",
      fullPath: "/",
      children: new Array<SideBarNode>(),
      isActualPage: false,
    };

    // Sort pages first by order, then by title
    const sortedPages = [...pages].sort((a, b) => {
      const oa =
        a.data && Object.keys(a.data).includes("order")
          ? (a.data["order" as keyof typeof a.data] as number)
          : undefined;
      const ob =
        b.data && Object.keys(b.data).includes("order")
          ? (b.data["order" as keyof typeof b.data] as number)
          : undefined;

      if (oa !== undefined && ob !== undefined) {
        return oa - ob;
      } else if (oa !== undefined) {
        return -1; // Items with order come first
      } else if (ob !== undefined) {
        return 1;
      } else {
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        const at = a.title ?? a.id;
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        const bt = b.title ?? b.id;
        return at.localeCompare(bt);
      }
    });

    // First pass: collect all page routes
    for (const page of sortedPages) {
      pageRoutes.add(page.route);

      //skip the auto generated 404 route
      //skip the api routes
      if (
        !page.route.localeCompare("/404/") ||
        page.route.startsWith("/api/")
      ) {
        continue;
      }

      if (!page.route.localeCompare("/")) {
        root = {
          ...page,
          fullPath: "/",
          children: new Array<SideBarNode>(),
          isActualPage: pageRoutes.has("/"),
        };
      }
    }

    // Second pass: create directory structure
    for (const page of sortedPages) {
      //skip the auto generated 404 route and api routes
      if (
        !page.route.localeCompare("/404/") ||
        page.route.startsWith("/api/")
      ) {
        continue;
      }

      // Clean the route string (remove leading/trailing slashes)
      const routePath = page.route.replace(/^\/|\/$/g, "");

      if (!routePath) {
        continue;
      }

      // Split the route into segments
      const segments = routePath.split("/");

      // Start at the root node
      let currentNode = root;
      let currentPath = "";

      // Build the tree by traversing through each segment
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        currentPath += "/" + segment;

        // Check if this path is an actual page
        const isActualPage = pageRoutes.has(currentPath);

        let childNode: SideBarNode | undefined = undefined;

        // If no child exists with this path, create one
        if (!pathsInTree.has(currentPath)) {
          childNode = {
            id: segment,
            children: new Array<SideBarNode>(),
            route: currentPath, // Set the route for directories too
            fullPath: currentPath,
            isActualPage: isActualPage,
          };
          currentNode.children.push(childNode);
          pathsInTree.add(childNode.fullPath);
        } else {
          childNode = currentNode.children.find((c) => {
            return !c.fullPath.localeCompare(currentPath);
          });

          // If this path is an actual page, mark it as such
          if (childNode && isActualPage) {
            childNode.isActualPage = true;
          }
        }

        // If this is the last segment, it's a page - copy all relevant properties from the page
        if (childNode && i === segments.length - 1) {
          // Preserve existing children if any
          const existingChildren = childNode.children;

          const newPage: SideBarNode = {
            ...page,
            fullPath: childNode.fullPath,
            children: existingChildren,
            title: this.getNavTitle(page),
            isActualPage: true,
          };

          // Replace the node with the page node
          const index = currentNode.children.findIndex(
            (c) => !c.fullPath.localeCompare(currentPath),
          );
          if (index !== -1) {
            currentNode.children[index] = newPage;
            childNode = newPage;
          }
        }

        // Move to the next level
        if (childNode) {
          currentNode = childNode;
        }
      }
    }

    // Sort the entire tree recursively after it's built
    this.sortTreeNodes(root);

    if (DEBUG) {
      console.log("Tree structure:", JSON.stringify(root, null, 2));
    }

    return root;
  };

  // Sort tree nodes recursively
  protected sortTreeNodes = (node: SideBarNode): void => {
    if (!node.children || node.children.length === 0) {
      return;
    }

    // Sort the current level
    node.children.sort((a, b) => {
      // Sort by order if available
      const orderA = this.getOrder(a);
      const orderB = this.getOrder(b);
      const titleA = a.title || a.id || "";
      const titleB = b.title || b.id || "";

      if (orderA !== null && orderB !== null) {
        //if two pages have the same order, sort by title, otherwise sort by order.
        return orderA - orderB ? orderA - orderB : titleA.localeCompare(titleB);
      } else if (orderA !== null) {
        return -1; // Items with order come first
      } else if (orderB !== null) {
        return 1;
      }

      // Then sort by title

      return titleA.localeCompare(titleB);
    });

    // Sort children recursively
    for (const child of node.children) {
      this.sortTreeNodes(child);
    }
  };

  // Get order value from page data if available
  protected getOrder = (node: SideBarNode): number | null => {
    if (node.data && Object.keys(node.data).includes("order")) {
      return node.data["order" as keyof typeof node.data];
    }
    return null;
  };

  // Generate the sidebar HTML
  protected generateSidebarHTML = (
    node: SideBarNode,
    currentRoute: string,
    level: number = 0,
  ): string => {
    if (!node.children.length) {
      return "";
    }

    let html = `
      <ul class="spectrum-SideNav spectrum-SideNav--multiLevel spectrum-SideNav--hasIcon">
    `;

    // Sort nodes
    node.children.sort((a, b) => {
      // sort by order if available
      const orderA = this.getOrder(a);
      const orderB = this.getOrder(b);

      if (orderA !== null && orderB !== null) {
        return orderA - orderB;
      } else if (orderA !== null) {
        return -1;
      } else if (orderB !== null) {
        return 1;
      }

      // Then sort by title
      const titleA = a.title || a.id || "";
      const titleB = b.title || b.id || "";
      return titleA.localeCompare(titleB);
    });

    for (const child of node.children) {
      const isDirectory = child.children.length > 0;
      const isSelected = !child.route?.localeCompare(currentRoute);

      // Determine if this node is in the path to the current route
      const isInPathToCurrentRoute = currentRoute.startsWith(
        child.route || child.fullPath,
      );
      if (DEBUG) {
        console.log(
          `for child ${child.id} with route ${child.route}, determined it ${isInPathToCurrentRoute ? "is" : "is not"} in ${currentRoute}`,
        );
      }

      // Choose appropriate icon
      let icon = "ion:book-outline"; // Default for leaf pages
      if (isDirectory) {
        icon = child.isActualPage ? "tabler:folder-open" : "tabler:folder";
      }

      // Determine if this node should be expanded
      // 1. Top level directories are always displayed
      // 2. Nodes in the path to the current route are expanded
      // 3. Siblings of the current entry are displayed but not expanded
      const shouldExpand = isInPathToCurrentRoute;

      html += `
          <li
            id="${child.id}"
            class="spectrum-SideNav-item ${isSelected ? "is-selected" : ""}"
            data-path="${child.fullPath}"
            data-is-page="${child.isActualPage ? "true" : "false"}"
          >
            <a href="${child.route || "#"}" class="spectrum-SideNav-itemLink">
              <iconify-icon
                icon="${icon}"
                height="1rem"
                inline
                aria-hidden="true"
                role="img"
              ></iconify-icon>
              <span class="spectrum-SideNav-itemLink-text">${child.title || child.id}</span>
            </a>
            ${child.children.length && shouldExpand ? this.generateSidebarHTML(child, currentRoute, level + 1) : ""}
          </li>
        `;
    }

    html += "</ul>";
    return html;
  };
}

const ExternalPluginSideBar = (options = {}): ResourcePlugin[] => {
  return [
    {
      type: "resource",
      name: "external-plugin-sidebar",
      provider: (compilation) => new SideBarResource(compilation, options),
    },
  ];
};

export { ExternalPluginSideBar };
