import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import "@/components/button/define";

async function mount(
	disabled: boolean,
	attributes: Record<string, string> = {},
	parent?: Element,
): Promise<HTMLElement> {
	const host = document.createElement("knui-button");
	host.toggleAttribute("disabled", disabled);
	for (const [name, value] of Object.entries(attributes)) {
		host.setAttribute(name, value);
	}
	host.textContent = "Save";
	document.body.replaceChildren(parent ?? host);
	parent?.append(host);
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

it("submit type submits the owning form", async () => {
	const form = document.createElement("form");
	const onSubmit = vi.fn((event: Event) => event.preventDefault());
	form.addEventListener("submit", onSubmit);
	const host = await mount(false, { type: "submit" }, form);

	await userEvent.click(host);

	expect(onSubmit).toHaveBeenCalledOnce();
});

it("reset type resets the owning form", async () => {
	const form = document.createElement("form");
	const onReset = vi.fn();
	form.addEventListener("reset", onReset);
	const host = await mount(false, { type: "reset" }, form);

	await userEvent.click(host);

	expect(onReset).toHaveBeenCalledOnce();
});

it("commandfor on the host invokes from the inner button", async () => {
	const dialog = document.createElement("dialog");
	dialog.id = "dialog";
	const parent = document.createElement("div");
	parent.append(dialog);
	const host = await mount(
		false,
		{ command: "show-modal", commandfor: "dialog" },
		parent,
	);

	await userEvent.click(host);

	expect(dialog.open).toBe(true);
});

it("aria attributes set later reach the inner button", async () => {
	const host = await mount(false);

	host.setAttribute("aria-label", "Save draft");

	await expect
		.poll(() =>
			host.shadowRoot?.querySelector("button")?.getAttribute("aria-label"),
		)
		.toBe("Save draft");
});
