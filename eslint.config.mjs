// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

// export default eslintConfig;
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat to load .eslintrc.* configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Load Next.js and TypeScript configurations
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom ESLint rules
  {
    rules: {
      // Disable all types of 'any' errors
      "@typescript-eslint/no-explicit-any": "off",

      // Allow unused variables without error
      "@typescript-eslint/no-unused-vars": "off",

      // Allow using var (not recommended, but will suppress the error)
      "no-var": "off",

      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "off",

      // Allow using 'let' instead of 'const'
      "prefer-const": "off",
    },
  },
];

export default eslintConfig;
