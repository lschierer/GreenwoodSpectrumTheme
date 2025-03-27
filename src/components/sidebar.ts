import debugFunction from "../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { getContent } from "@greenwood/cli/src/data/client.js";
import { type Page } from "@greenwood/cli";

import "iconify-icon";

interface SideBarNode {
  name: string;
  children: SideBarNode[];
  route?: string;
  title?: string;
  page?: Page;
}

import SpectrumCSSSideNav from "@spectrum-css/sidenav/index.css" with { type: "css" };
import LocalSidebarCSS from "../styles/sidebar.css" with { type: "css" };

export default class SideBar extends HTMLElement {
  private pages = new Array<Page>();
  private _route: string = "";
  private _stylesLoaded: boolean = false;
  private _routesToExclude = ["/404", "/api", "/policy"];

  protected loadStyles = () => {
    if (!this._stylesLoaded) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        SpectrumCSSSideNav,
        LocalSidebarCSS,
      ];
      this._stylesLoaded = true;
    }
  };

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("route")) {
        this._route = attr.value;
      }
    }
  };

  protected getPages = async () => {
    (await getContent())
      .filter((page: Page) => {
        if (
          this._routesToExclude
            .map((rte) => {
              return page.route.startsWith(rte);
            })
            .includes(true)
        ) {
          return false;
        }
        return true;
      })
      .sort((a: Page, b: Page) => {
        return a.route.localeCompare(b.route);
      })
      .map((p: Page) => this.pages.push(p));
    if (DEBUG) {
      console.log(`pages is: \n ${this.pages.map((p) => p.route).join("\n")}`);
    }
  };

  // Check if this node is in the direct path to the current route
  protected isInPathToCurrentRoute = (node: SideBarNode): boolean => {
    if (DEBUG) {
      console.log(
        `checking if ${node.route} is in the current route ${this._route}`
      );
    }

    if (node.route && node.route.length) {
      if (DEBUG) {
        console.log(`${node.route} exists to compare against ${this._route}`);
      }
      // If this is the current route, it's in the path
      if (!node.route.localeCompare(this._route)) {
        if (DEBUG) {
          console.log(`${node.route} is the same as ${this._route}`);
        }
        return true;
      }

      if (this._route.startsWith(node.route)) {
        if (DEBUG) {
          console.log(`current route ${this._route} starts with ${node.route}`);
        }
        return true;
      }
    }

    return false;
  };

  protected getOrder = (node: SideBarNode): number | null => {
    if (node.page) {
      if (node.page.data) {
        if (Object.keys(node.page.data).includes("sidebar")) {
          const sidebar =
            node.page.data["sidebar" as keyof typeof node.page.data];
          if (Object.keys(sidebar).includes("order")) {
            return sidebar["order" as keyof typeof sidebar];
          }
        }
      }
    }
    return null;
  };

  protected generateSidebarHTML = (
    node: SideBarNode,
    level: number = 0
  ): string => {
    if (!node.children.length) {
      return "";
    }

    let html = `
      <ul class="spectrum-SideNav spectrum-SideNav--multiLevel spectrum-SideNav--hasIcon">
    `;

    node.children
      .sort((a, b) => {
        // Helper function to get order value if it exists

        // First priority: Sort by order if available
        const orderA = this.getOrder(a);
        const orderB = this.getOrder(b);

        if (orderA !== null && orderB !== null) {
          return orderA - orderB;
        } else if (orderA !== null) {
          return -1; // A has order, B doesn't, so A comes first
        } else if (orderB !== null) {
          return 1; // B has order, A doesn't, so B comes first
        }

        // Second priority: Sort by title if available
        const titleA = a.title && a.title.length ? a.title : a.name;
        const titleB = b.title && b.title.length ? b.title : b.name;

        if (!titleA && titleB) return 1;
        if (titleA && !titleB) return -1;

        // Default case: compare by name/title
        return titleA.localeCompare(titleB);
      })
      .forEach((child) => {
        let childContents = "";

        if (child.children.length) {
          childContents += `
          <iconify-icon
            icon="tabler:folder-open"
            height="1rem"
            inline
            aria-hidden="true"
            role="img"
          ></iconify-icon>
        `;
        } else {
          childContents += `
          <iconify-icon
            icon="ion:book-outline"
            height="1rem"
            inline
            aria-hidden="true"
            role="img"
          ></iconify-icon>
        `;
        }

        childContents += `
        <span class="${child.route ? "spectrum-SideNav-itemLink-text" : ""}">${
          child.title ? child.title : child.name
        }</span>
      `;
        const selected = child.route
          ? !child.route.localeCompare(this._route)
          : false;

        // Determine if this node should be expanded
        // Always show top level nodes, and only expand nodes in the path to the current route
        const shouldExpand = this.isInPathToCurrentRoute(child);
        if (DEBUG) {
          console.log(
            `shouldExpand got ${shouldExpand} from isInPathToCurrentRoute`
          );
        }

        html +=
          "  ".repeat(level + 1) +
          `
        <li
          id="${child.name}"
          class="spectrum-SideNav-item ${selected ? "is-selected" : ""}"
        >
          ${child.route ? `<a href="${child.route}" class="spectrum-SideNav-itemLink">` : `<span class="spectrum-SideNav-itemLink">`}
            ${childContents}
          ${child.route ? "</a>" : "</span>"}
          ${child.children.length && shouldExpand ? this.generateSidebarHTML(child, level + 2) : ""}
        </li>
      `;
      });

    html += "  ".repeat(level) + "</ul>\n";

    return html;
  };

  protected getNavTitle = (page: Page) => {
    if (page.title) {
      return page.title;
    } else if (page.label) {
      return page.label.replaceAll("_", " ");
    } else {
      return page.route.split("/").pop();
    }
  };

  protected buildRouteTree = (pages: Page[]): SideBarNode => {
    const root: SideBarNode = {
      name: "/",
      title: "root",
      route: "/",
      children: new Array<SideBarNode>(),
    };

    for (const page of pages) {
      // Clean the route string (remove leading/trailing slashes)
      const routePath = page.route.replace(/^\/|\/$/g, "");

      if (!routePath) continue; // Skip empty routes

      // Split the route into segments
      const segments = routePath.split("/");

      // Start at the root node
      let currentNode = root;

      // Build the tree by traversing through each segment
      segments.forEach((segment, index) => {
        // Look for an existing child with this name
        let childNode = currentNode.children.find(
          (child) => child.name === segment
        );

        // If no child exists with this name, create one
        if (!childNode) {
          childNode = {
            name: segment,
            children: new Array<SideBarNode>(),
          };
          currentNode.children.push(childNode);
        }

        // If this is the last segment, store the full route
        if (index === segments.length - 1) {
          childNode.route = page.route;
          childNode.title = this.getNavTitle(page);
          childNode.page = page;
        }

        // Move to the next level
        currentNode = childNode;
      });
    }

    return root;
  };

  public async connectedCallback() {
    this.loadStyles();
    this.getAttributes();
    await this.getPages();

    if (this.pages.length) {
      this.innerHTML = this.generateSidebarHTML(
        this.buildRouteTree(this.pages)
      );
    } else {
      this.innerHTML = `
        <nav>
          <span>No Route Provided</span>
        </nav>
      `;
    }
  }
}
customElements.define("side-bar", SideBar);
