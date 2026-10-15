import type { BrowserCommand } from "vite-plus/test/node";

export const computedRole: BrowserCommand<[selector: string]> = async (
	{ browser },
	selector,
) => browser.$(selector).getComputedRole();
