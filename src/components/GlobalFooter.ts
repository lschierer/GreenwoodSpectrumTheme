import { config } from "../lib/config.ts";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log("DEBUG enabled for ${new URL(import.meta.url).pathname}");
}

import styles from "../styles/GlobalFooter.css" with { type: "css" };

export default class GlobalFooter extends HTMLElement {
  connectedCallback() {
    document.adoptedStyleSheets.push(styles);
    this.innerHTML = `
      <div class="footer">
      ${
        config.privacyPolicy
          ? `
        <span class="privacy spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light">
          <a href="${config.privacyPolicy}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--primary">
            Privacy Policy
          </a>
        </span>
        `
          : ""
      }

        <span id="copyright" class="copyright spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light">
          COPYRIGHTPLACEHOLDER
        </span>
      </div>
    `;
  }
}
customElements.define("global-footer", GlobalFooter);
