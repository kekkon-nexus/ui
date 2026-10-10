import { unpluginStencil } from "@stencil/unplugin";
import { defineConfig } from "vite-plus";

// oxlint-disable-next-line no-relative-import-paths/no-relative-import-paths -- Vite doesn't resolve tsconfig paths in its own config
import { noSelfRegister } from "./plugins/no-self-register.ts";

const config: ReturnType<typeof defineConfig> = defineConfig({
	resolve: {
		tsconfigPaths: true,
	},

	pack: {
		plugins: [
			unpluginStencil.rolldown({
				docs: true,
				types: true,
			}),
			noSelfRegister,
		],

		entry: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/**/*.d.ts"],
		root: "src",
		unbundle: true,

		copy: ["src/components.d.ts"],

		fixedExtension: false,
		sourcemap: true,
	},
});

export default config;
