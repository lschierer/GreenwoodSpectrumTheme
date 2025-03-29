import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
import "./ThemeSelector.ts";

import { config } from "../lib/staticConfig.ts";

import styles from "../styles/TopHeader.css" with { type: "css" };

import "./SiteTitle.ts";
export default class TopHeader extends HTMLElement {
  connectedCallback() {
    document.adoptedStyleSheets.push(styles);

    this.innerHTML = `

      <div class="header">
          <site-title ></site-title>
        <div class="nav">
          ${config.topLevelSections
            .sort()
            .map((section) => {
              return `
              <div class="navItem">
                <a
                  href=${"/" + section.replaceAll(" ", "") + "/"}
                  class="spectrum-Link spectrum-Link--primary"
                >
                  <span class="">${section.replaceAll("_", " ")}</span>
                </a>
              </div>
            `;
            })
            .join(" ")}
        </div>
        <div class=" right-group">
          <div class=" social-icons">
            <SocialIcons {...Astro.props} ></SocialIcons>
          </div>
          <theme-select></theme-select>
        </div>
      </div>
    `;
  }
}
customElements.define("top-header", TopHeader);
