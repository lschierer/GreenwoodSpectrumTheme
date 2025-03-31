import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/.greenwood/**", "**/public/**", "**/dist/**"],
  },
  {
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.strictTypeChecked,
    ],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["fix-declarations.js", "postcss.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
        projectFolderIgnoreList: ["**/node_modules/**"],
      },
    },
  },
  {
    files: ["**/*/*.js", "**/*/*.mjs", "fix-declarations.js"],
    ignores: ["public/**"],
    extends: [eslint.configs.recommended, tseslint.configs.disableTypeChecked],
  },
);
