import { config } from "../lib/config.ts";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log("DEBUG enabled for ${new URL(import.meta.url).pathname}");
}

export default class GlobalFooter extends HTMLElement {
  connectedCallback() {
    const footer = document.querySelector("footer");
    if (footer) {
      if (config.privacyPolicy) {
        const template = document.createElement("template");
        template.innerHTML = `
          <span class="privacy spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light">
            <a href="${config.privacyPolicy}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--primary">
              Privacy Policy
            </a>
          </span>
        `;
        footer.appendChild(template.content.cloneNode(true));
      }
    }
  }
}
customElements.define("global-footer", GlobalFooter);
