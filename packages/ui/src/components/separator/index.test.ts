import { Readability } from "@mozilla/readability";
import { expect, it } from "vite-plus/test";
import { commands } from "vite-plus/test/browser";

import "@/components/separator/define";

async function mount(
	attributes: Record<string, string> = {},
): Promise<HTMLElement> {
	const host = document.createElement("knui-separator");
	for (const [name, value] of Object.entries(attributes)) {
		host.setAttribute(name, value);
	}
	document.body.replaceChildren(host);
	await expect.poll(() => host.shadowRoot).toBeTruthy();
	return host;
}

it("defaults to horizontal and reflects it", async () => {
	const host = await mount();

	await expect.poll(() => host.getAttribute("orientation")).toBe("horizontal");
});

it("keeps an authored orientation", async () => {
	const host = await mount({ orientation: "vertical" });

	expect(host.getAttribute("orientation")).toBe("vertical");
});

it("exposes the separator role", async () => {
	await mount({ id: "separator" });

	expect(await commands.computedRole("#separator")).toBe("separator");
});

// Firefox Reader View runs on Readability.
it.each(["hr", "knui-separator"])(
	"reader view keeps %s between paragraphs",
	(tag) => {
		const paragraph = `<p>${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(12)}</p>`;
		const page = new DOMParser().parseFromString(
			`<article>${paragraph}<${tag}></${tag}>${paragraph}</article>`,
			"text/html",
		);

		const article = new Readability(page).parse();

		expect(article?.content).toContain(`<${tag}`);
	},
);
