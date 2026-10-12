import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import "@/components/button/define";

async function mount(disabled: boolean): Promise<HTMLElement> {
	const host = document.createElement("knui-button");
	host.toggleAttribute("disabled", disabled);
	host.textContent = "Save";
	document.body.replaceChildren(host);
	await expect
		.poll(() => host.shadowRoot?.querySelector("button"))
		.toBeTruthy();
	return host;
}

it("click reaches the host", async () => {
	const host = await mount(false);
	const onClick = vi.fn();
	host.addEventListener("click", onClick);

	await userEvent.click(host);

	expect(onClick).toHaveBeenCalledOnce();
});

it("disabled swallows the click", async () => {
	const host = await mount(true);
	const onClick = vi.fn();
	host.addEventListener("click", onClick);

	await userEvent.click(host);

	expect(onClick).not.toHaveBeenCalled();
});
