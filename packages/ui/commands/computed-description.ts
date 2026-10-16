import type { BrowserCommand } from "vite-plus/test/node";

interface DomNode {
	nodeId: number;
	children?: DomNode[];
	contentDocument?: DomNode;
	shadowRoots?: DomNode[];
}

function* documents(node: DomNode): Generator<DomNode> {
	if (node.contentDocument) {
		yield node.contentDocument;
		yield* documents(node.contentDocument);
	}
	for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
		yield* documents(child);
	}
}

/**
 * WebDriver has no Get Computed Description, so this asks Chrome DevTools Protocol, Chrome only.
 * Tests run inside iframes, so the selector is tried in every frame's document.
 *
 * @param context the command context, holding the WebdriverIO browser
 * @param selector a CSS selector for the described element
 * @returns the element's computed accessible description
 */
export const computedDescription: BrowserCommand<[selector: string]> = async (
	context,
	selector,
) => {
	const send = <T>(cmd: string, params: object = {}): Promise<T> =>
		context.browser.sendCommandAndGetResult(cmd, params) as Promise<T>;

	const { root } = await send<{ root: DomNode }>("DOM.getDocument", {
		depth: -1,
		pierce: true,
	});
	for (const document of [root, ...documents(root)]) {
		const { nodeId } = await send<{ nodeId: number }>("DOM.querySelector", {
			nodeId: document.nodeId,
			selector,
		});
		if (!nodeId) continue;
		const { nodes } = await send<{
			nodes: { description?: { value: string } }[];
		}>("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
		return nodes[0]?.description?.value ?? "";
	}
	throw new Error(`no element matches ${selector}`);
};
