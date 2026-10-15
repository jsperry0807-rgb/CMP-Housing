import config from "@repo/eslint-config";
import globals from "globals";

export default [
  ...config,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
