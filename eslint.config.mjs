// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tslint from "typescript-eslint";

export default defineConfig(
	eslint.configs.recommended,
	...tslint.configs.strictTypeChecked,
	...tslint.configs.stylisticTypeChecked,
	{
		ignores: [".idea/", ".make", ".vscode/"],
	},
	{
		languageOptions: {
			parserOptions: {
				project: ["tsconfig.eslint.json", "tsconfig.json"],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
	{
		files: ["eslint.config.mjs"],
		rules: {
			// Can't seem to source types for this anywhere
			"@typescript-eslint/no-unsafe-member-access": "off",
			// UGH WHY
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
		},
	},
);
