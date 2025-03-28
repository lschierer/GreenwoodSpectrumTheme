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
import { JSDOM } from "jsdom";

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
    let body = await response.text();

    const dom = new JSDOM(body);
    const document = dom.window.document;
    const sidebarElement = document.querySelector("div.nav");
    if (sidebarElement) {
      const rootNode = this.buildRouteTree(this.compilation.graph);
      const sidebarHtml = this.generateSidebarHTML(rootNode, url.pathname);

      // Insert the generated sidebar HTML
      sidebarElement.innerHTML = sidebarHtml;

      const headers = document.querySelector("head");
      if (headers) {
        const SpectrumCSSSideNav = document.createElement("link");
        SpectrumCSSSideNav.setAttribute(
          "href", // Fixed: src -> href for link elements
          "/node_modules/@spectrum-css/sidenav/dist/index.css",
        );
        SpectrumCSSSideNav.setAttribute("rel", "stylesheet");

        const LocalSidebarCSS = document.createElement("link");
        LocalSidebarCSS.setAttribute(
          "href", // Fixed: src -> href
          "/styles/sidebar.css",
        );
        LocalSidebarCSS.setAttribute("rel", "stylesheet");

        headers.appendChild(SpectrumCSSSideNav);
        headers.appendChild(LocalSidebarCSS);

        // Add iconify script for icons
        const iconifyScript = document.createElement("script");
        iconifyScript.setAttribute(
          "src",
          "https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js",
        );
        headers.appendChild(iconifyScript);
      }

      body = dom.serialize();
    }
    return new Response(body, {
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

    for (const page of pages) {
      pageRoutes.add(page.route);

      //skip the auto generated 404 route
      if (!page.route.localeCompare("/404/")) {
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

    // First pass: create directory structure
    for (const page of pages) {
      //skip the auto generated 404 route
      if (!page.route.localeCompare("/404/")) {
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

    if (DEBUG) {
      console.log("Tree structure:", JSON.stringify(root, null, 2));
    }

    return root;
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
