/// <reference types="webdriverio" />
import "vite-plus/test/browser";

declare module "vite-plus/test/browser" {
	interface BrowserCommands {
		computedRole: (
			selector: string,
		) => ReturnType<WebdriverIO.Element["getComputedRole"]>;
	}
}
