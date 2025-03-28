import type { Page } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export default class StandardLayout extends HTMLElement {
  async connectedCallback() {
    /*start work around for GetFrontmatter requiring async */
    await new Promise((resolve) => setTimeout(resolve, 1));
    /* end workaround */
    let title = "";
    let route = "";
    if (Object.keys(globalThis).includes("page")) {
      const page: Page = globalThis["page" as keyof typeof globalThis] as Page;
      if (page.title.length) {
        if (DEBUG) {
          console.log(`found title ${page.title}`);
        }
        title = page.title;
      }
      if (page.route.length) {
        route = page.route;
        if (DEBUG) {
          console.log(`found route ${route}`);
        }
      }
    }
    this.innerHTML = `
      <head>
        <script type="module" src="../components/sidebar.ts"></script>
        <script type="module" >
          import "@spectrum-web-components/split-view/sp-split-view.js";
        </script>
      </head>
      <body>
        <header>
          <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
            ${title}
          </h1>
        </header>

        <sp-split-view resizable primary-size="20%">
          <div class="nav">
            <side-bar route="${route}"></side-bar>
          </div>
          <div>
            <main>
              <content-outlet></content-outlet>
            </main>
          </div>
        </sp-split-view>
      </body>
    `;
  }
}
