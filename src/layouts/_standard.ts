import type { GetLayout, Compilation, Page } from "@greenwood/cli";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.log(`DEBUG is ${DEBUG} for ${new URL(import.meta.url).pathname}`);

export const getLayout: GetLayout = async (
  compilation: Compilation,
  page: string | Page,
) => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  let title = "";
  let route = "";
  if (typeof page === "object") {
    if (Object.keys(page).includes("title")) {
      title = page.title;
    }
    if (Object.keys(page).includes("route")) {
      route = page.route;
    }
  } else {
    route = page;
  }

  return `
  <head>
    <script type="module" src="../components/sidebar.ts"></script>
    <script type="module" >
      import "@spectrum-web-components/split-view/sp-split-view.js";
    </script>
  </head>
  <body>
    <div class="title section">
      <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
        ${title}
      </h1>
    </div>

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
};
