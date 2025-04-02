//Do not change here, change below in the Record.
let DEBUG: boolean = false;

const fileDebug: Record<string, boolean> = {
  "/components/DirectoryIndex.ts": false,
  "/components/ThemeSelector.ts": false,
  "/components/theme.ts": false,
  "/greenwood-spectrum-theme.config.ts": false,
  "/greenwood-spectrum-theme.ts": false,
  "/index.ts": false,
  "/layouts/_standard.ts": false,
  "/lib/config.ts": false,
  "/lib/debug.ts": false,
  "/plugins/ComponentResourcePlugin.ts": true,
  "/plugins/DirectoryIndexPlugin.ts": false,
  "/plugins/FooterSectionPlugin.ts": false,
  "/plugins/SideBarPlugin.ts": false,
  "/plugins/ThemePackResourcePlugin.ts": false,
  "/plugins/TopHeaderSectionPlugin.ts": false,
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
