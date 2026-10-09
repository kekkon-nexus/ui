import { glob } from "node:fs/promises";

import oxfmt from "@kekkon-nexus/config/oxfmt";
import oxlint from "@kekkon-nexus/config/oxlint";
import vp from "@kekkon-nexus/config/oxlint/vite-plus";
import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		...oxfmt,
	},
	lint: {
		extends: [oxlint, vp],
		options: {
			typeAware: true,
			typeCheck: true,
		},
		jsPlugins: [
			{
				name: "no-relative-import-paths",
				specifier: "eslint-plugin-no-relative-import-paths",
			},
		],

		overrides: await Array.fromAsync(glob("packages/*"), (dir) => ({
			files: [`${dir}/**`],
			rules: {
				"no-relative-import-paths/no-relative-import-paths": [
					"warn",
					{
						allowSameFolder: false,
						rootDir: `./${dir}/src`,
						prefix: "#",
					},
				],
			},
		})),
	},
	staged: {
		"*": "vp check --fix --no-error-on-unmatched-pattern",
	},

	resolve: {
		conditions: ["dev"],
	},
	ssr: {
		resolve: {
			conditions: ["dev"],
		},
	},

	run: {
		cache: true,
	},
});
