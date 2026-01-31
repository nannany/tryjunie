import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import js from "@eslint/js"; // For eslint:recommended

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "supabase/functions/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/test/",
    ],
  },
  // Configuration for CJS config files (e.g., postcss.config.cjs, tailwind.config.cjs)
  {
    files: ["*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        module: "writable",
        require: "writable",
        process: "readonly",
        console: "readonly", // adding console global for CJS files
      },
    },
    rules: {
      // specific rules for CJS if any, e.g. disable typescript specific rules if they bleed
      "@typescript-eslint/no-var-requires": "off", // Allow require in .cjs files
      "@typescript-eslint/no-require-imports": "off", // Allow require in .cjs files
    },
  },
  // Configuration for eslint.config.js itself (ES Module)
  {
    files: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        process: "readonly",
      },
    },
    plugins: {
      // Ensure typescript plugin is available for rules if needed, though less common for eslint.config.js
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Example: allow console in eslint.config.js
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Configuration for TypeScript and TSX files (main src project)
  {
    files: ["src/**/*.{ts,tsx}"], // More specific to src
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules, // ESLint recommended rules
      ...tseslint.configs.recommended.rules, // TypeScript recommended
      ...pluginReact.configs.recommended.rules, // React recommended
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-undef": "error", // Ensure this is active to catch undefined variables
      "no-unused-vars": "off", // Disable base rule as we use @typescript-eslint/no-unused-vars
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // 先頭に _ を付けた変数・引数は許容
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Configuration for mcp project
  {
    files: ["mcp/src/**/*.{ts,tsx}"], // Adjust glob as needed
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./mcp/tsconfig.json",
        ecmaFeatures: { jsx: true }, // Assuming JSX might be used, adjust if not
        sourceType: "module",
      },
      globals: {
        // Adjust globals as needed for mcp project
        ...globals.node, // Or browser, depending on mcp's environment
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      // Add other plugins if mcp uses React, etc.
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Add or override rules specific to mcp project
    },
  },
  // Configuration for vite.config.ts
  {
    files: ["vite.config.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.node.json", // Use the tsconfig for Node environment
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Add or override rules specific to vite.config.ts
    },
  },
];
