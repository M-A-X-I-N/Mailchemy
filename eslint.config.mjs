import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const codeStyleRules = {
    curly: ["error", "multi-or-nest"],
    "nonblock-statement-body-position": ["error", "below"],
    indent: ["error", 4, { SwitchCase: 1 }],
    "no-trailing-spaces": "error",
    "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
};

export default defineConfig(
    {
        ignores: ["**/dist/**", "**/node_modules/**"],
    },
    {
        files: ["packages/*/src/**/*.ts"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...codeStyleRules,
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/switch-exhaustiveness-check": "error",
        },
    },
    {
        files: ["packages/*/test/**/*.ts"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strict,
            tseslint.configs.stylistic,
        ],
        rules: codeStyleRules,
    },
);
