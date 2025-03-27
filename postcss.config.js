import path from "path";

const plugins = {
  "postcss-import": {
    path: [
      path.resolve(new URL(import.meta.url).pathname, "..", "node_modules"),
    ],
  },
  "postcss-extend": {},
  "postcss-nesting": {},
  "postcss-sorting": {
    order: ["custom-properties", "declarations", "at-rules", "rules"],
    "properties-order": "alphabetical",
  },
  autoprefixer: {},
};

// Conditional plugin inclusion based on environment
/*if (!process.env.__GWD_COMMAND__ === "serve") {
  plugins["cssnano"] = {
    preset: "default",
  };
}*/
console.log(`postcss plugins are ${JSON.stringify(plugins)}`);
export default {
  plugins: plugins,
};
