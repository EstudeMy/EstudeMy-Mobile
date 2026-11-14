// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/**",
      ".expo/**",
      "public/**",
      "scripts/**",
      "ml/**",
      "deploy/**",
      "android/**",
      "assets/**",
      "plugins/**",
      "docs/**",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "import/no-named-as-default": "off",
    },
  }
]);
