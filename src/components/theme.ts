import { z } from "zod";

import { type Theme as SPTheme } from "@spectrum-web-components/theme";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const Theme = z.union([z.literal("light"), z.literal("dark")]);
type Theme = z.infer<typeof Theme>;

export const ThemeSelection = z.union([Theme, z.literal("auto")]);
type ThemeSelection = z.infer<typeof ThemeSelection>;

export const ChangeTheme = (storedTheme: ThemeSelection) => {
  if (
    !storedTheme.localeCompare("light") ||
    !storedTheme.localeCompare("dark")
  ) {
    const scale = "medium";
    document.querySelectorAll("sp-theme").forEach((sptheme) => {
      void Promise.all([
        import(`@spectrum-web-components/theme/theme-${storedTheme}.js`),
        import(`@spectrum-web-components/theme/scale-${scale}.js`),
      ]).then(() => {
        (sptheme as SPTheme).color = storedTheme as Theme;
        (sptheme as SPTheme).scale = scale;
      });
    });
    document.querySelectorAll("html").forEach((html) => {
      if (!html.classList.contains("spectrum")) {
        html.classList.add("spectrum");
      }
      if (!html.classList.contains(storedTheme)) {
        if (!storedTheme.localeCompare("light")) {
          html.classList.add("spectrum--light");
          html.classList.add("light");
          html.classList.remove("dark");
          html.classList.remove("spectrum--dark");
        } else {
          html.classList.remove("spectrum--light");
          html.classList.remove("light");
          html.classList.add("dark");
          html.classList.add("spectrum--dark");
        }
      }
      if (!html.classList.contains(scale)) {
        html.classList.add(scale);
      }
      if (!html.classList.contains(`spectrum--${scale}`)) {
        html.classList.add(`spectrum--${scale}`);
      }
      if (!html.classList.contains("spectrum-Typography")) {
        html.classList.add("spectrum-Typography");
      }
    });
  } else {
    ChangeTheme("light");
  }
};

export default class ThemeComponent extends HTMLElement {
  private storedTheme: Theme = "light";

  private ThemeProvider = () => {
    const storedTheme =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("hpfansite-theme");
    const theme =
      storedTheme ||
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    document.documentElement.dataset.theme =
      theme === "light" ? "light" : "dark";
  };
  connectedCallback() {
    if (DEBUG) {
      console.log(`connectedCallback for ThemeComponent`);
    }
    this.ThemeProvider();
    ChangeTheme(this.storedTheme);
  }
}
customElements.define("theme-component", ThemeComponent);
