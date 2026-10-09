import { defineConfig } from "vite-plus";

export default defineConfig({
	resolve: {
		conditions: ["dev"],
	},
	ssr: {
		resolve: {
			conditions: ["dev"],
		},
	},

	pack: {
		entry: ["src/**/*.ts", "!src/**/*.test.ts"],
		fixedExtension: false,
		sourcemap: true,

		deps: {
			neverBundle: [/^#/],
		},
	},
});
