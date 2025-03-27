import "iconify-icon";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { ChangeTheme, ThemeSelection } from "./theme.ts";

export default class ThemeSelector extends HTMLElement {
  private options = [
    {
      label: "dark",
      selected: false,
      value: "dark",
    },
    {
      label: "light",
      selected: false,
      value: "light",
    },
    {
      label: "auto",
      selected: true,
      value: "auto",
    },
  ];
  protected ThemeChangedCallback = (e: Event) => {
    const target = (e as CustomEvent).target as HTMLSelectElement | null;
    if (target) {
      const value = target.value;
      if (DEBUG) {
        console.log(`ThemeChangedCallback detects value ${value}`);
      }
      if (value) {
        const valid = ThemeSelection.safeParse(value);
        if (valid.success) {
          ChangeTheme(valid.data);
        } else {
          if (DEBUG) {
            console.log(
              `error getting value in ThemeChangedCallback`,
              valid.error.message
            );
          }
        }
      }
    }
  };

  connectedCallback() {
    this.innerHTML = `
     <select
        class="spectrum-Picker spectrum-Picker--sizeM"
        id="ThemeSelector"
        label={Astro.locals.t('themeSelect.accessibleLabel')}
        value="auto"
        width="6.25em"
     >
       ${this.options
         .map((option) => {
           return `
            <option
              value=${option.value}
              ${option.selected ? "selected" : ""}
              class="spectrum-Menu-item" >
                ${option.label}
            </option>
         `;
         })
         .join("")}
     </select>
    `;
    const select = this.querySelector("#ThemeSelector");
    if (select) {
      select.addEventListener("change", this.ThemeChangedCallback);
    } else {
      if (DEBUG) {
        console.log(`cannot find select in template`);
      }
    }
  }
}
customElements.define("theme-select", ThemeSelector);
