//Do not change here, change below in the Record.
let DEBUG: boolean = false;

const fileDebug: Record<string, boolean> = {
  "/components/DirectoryIndex.ts": false,
  "/components/GlobalFooter.ts": false,
  "/components/SiteTitle.ts": false,
  "/components/ThemeSelector.ts": false,
  "/components/TopHeader.ts": false,
  "/components/sidebar.ts": false,
  "/components/theme.ts": false,
  "/greenwood-spectrum-theme.config.ts": false,
  "/layouts/standard.ts": false,
  "/lib/config.ts": false,
  "/lib/debug.ts": false,
  "/plugins/DirectoryIndexPlugin.ts": false,
  "/plugins/FooterSectionPlugin.ts": false,
  "/plugins/SideBarPlugin.ts": false,
  "/plugins/ConfigFileProviderPlugin.ts": false,
};

function isAbsolutePath(path: string): boolean {
  DEBUG = fileDebug[new URL(import.meta.url).pathname];
  // Check for Unix-style absolute paths (starts with `/`)
  if (path.startsWith("/")) return true;

  // Check for Windows-style absolute paths (e.g., `C:\Users\Example`)
  if (/^[a-zA-Z]:[\\/]/.test(path)) return true;

  // Check for absolute URLs
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}

const debugFunction = (myName: string): boolean => {
  DEBUG = fileDebug[new URL(import.meta.url).pathname];
  if (isAbsolutePath(myName)) {
    let root = "";

    const rootStack = new URL(import.meta.url).pathname.split("/");
    root = rootStack.slice(0, -2).join("/");

    myName = myName.replace(root, "");
    if (DEBUG) {
      console.log(`new name is ${myName}, root was ${root}`);
    }
  } else {
    if (DEBUG) {
      console.log(`got path ${myName}`);
    }
  }
  return fileDebug[myName];
};

export default debugFunction;
