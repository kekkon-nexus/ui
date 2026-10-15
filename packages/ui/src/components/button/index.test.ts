import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import "@/components/button/define";

const referenceTargetSupported = "referenceTarget" in ShadowRoot.prototype;

async function mount(
	attributes: Record<string, string> = {},
	parent?: Element,
): Promise<HTMLElement> {
	const host = document.createElement("knui-button");
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

it("props start at their defaults", async () => {
	const host = (await mount()) as HTMLKnuiButtonElement;

	expect({
		disabled: host.disabled,
		focusableWhenDisabled: host.focusableWhenDisabled,
		type: host.type,
	}).toEqual({ disabled: false, focusableWhenDisabled: false, type: "button" });
});

it("click reaches the host", async () => {
	const host = await mount();
	const onClick = vi.fn();
	host.addEventListener("click", onClick);

	await userEvent.click(host);

	expect(onClick).toHaveBeenCalledOnce();
});

it("disabled swallows the click", async () => {
	const host = await mount({ disabled: "" });
	const onClick = vi.fn();
	host.addEventListener("click", onClick);

	await userEvent.click(host);

	expect(onClick).not.toHaveBeenCalled();
});

it("disabled leaves the tab order", async () => {
	const parent = document.createElement("div");
	await mount({ disabled: "" }, parent);
	// Without a later tab stop, Tab moves focus out of the document and the next test starts there.
	const next = document.createElement("button");
	parent.append(next);

	await userEvent.tab();

	expect(document.activeElement).toBe(next);
});

it("focusable when disabled stays in the tab order", async () => {
	const host = await mount({ "disabled": "", "focusable-when-disabled": "" });
	await expect
		.poll(() =>
			host.shadowRoot?.querySelector("button")?.getAttribute("aria-disabled"),
		)
		.toBe("true");

	await userEvent.tab();

	expect(document.activeElement).toBe(host);
});

it("focusable when disabled swallows the click", async () => {
	const host = await mount({ "disabled": "", "focusable-when-disabled": "" });
	const onClick = vi.fn();
	host.addEventListener("click", onClick);

	await userEvent.click(host);

	expect(onClick).not.toHaveBeenCalled();
});

it("focusable when disabled leaves the owning form alone", async () => {
	const form = document.createElement("form");
	const onSubmit = vi.fn((event: Event) => event.preventDefault());
	form.addEventListener("submit", onSubmit);
	const host = await mount(
		{ "disabled": "", "focusable-when-disabled": "", "type": "submit" },
		form,
	);

	await userEvent.click(host);

	expect(onSubmit).not.toHaveBeenCalled();
});

it("focusable when disabled does not invoke commandfor", async () => {
	const dialog = document.createElement("dialog");
	dialog.id = "dialog";
	const parent = document.createElement("div");
	parent.append(dialog);
	const host = await mount(
		{
			"disabled": "",
			"focusable-when-disabled": "",
			"command": "show-modal",
			"commandfor": "dialog",
		},
		parent,
	);

	await userEvent.click(host);

	expect(dialog.open).toBe(false);
});

it("button type leaves the owning form alone", async () => {
	const form = document.createElement("form");
	const onSubmit = vi.fn((event: Event) => event.preventDefault());
	form.addEventListener("submit", onSubmit);
	const host = await mount({}, form);

	await userEvent.click(host);

	expect(onSubmit).not.toHaveBeenCalled();
});

it("submit type submits the owning form", async () => {
	const form = document.createElement("form");
	const onSubmit = vi.fn((event: Event) => event.preventDefault());
	form.addEventListener("submit", onSubmit);
	const host = await mount({ type: "submit" }, form);

	await userEvent.click(host);

	expect(onSubmit).toHaveBeenCalledOnce();
});

it("reset type resets the owning form", async () => {
	const form = document.createElement("form");
	const onReset = vi.fn();
	form.addEventListener("reset", onReset);
	const host = await mount({ type: "reset" }, form);

	await userEvent.click(host);

	expect(onReset).toHaveBeenCalledOnce();
});

it("commandfor on the host invokes from the inner button", async () => {
	const dialog = document.createElement("dialog");
	dialog.id = "dialog";
	const parent = document.createElement("div");
	parent.append(dialog);
	const host = await mount(
		{ command: "show-modal", commandfor: "dialog" },
		parent,
	);

	await userEvent.click(host);

	expect(dialog.open).toBe(true);
});

it("aria-labelledby on the host resolves to elements for the inner button", async () => {
	const first = document.createElement("span");
	first.id = "first";
	const second = document.createElement("span");
	second.id = "second";
	const parent = document.createElement("div");
	parent.append(first, second);
	const host = await mount(
		{ "aria-labelledby": "first  missing second" },
		parent,
	);

	await expect
		.poll(() =>
			host.shadowRoot
				?.querySelector("button")
				?.ariaLabelledByElements?.map((element) => element.id),
		)
		.toEqual(["first", "second"]);
});

// Without reference target the label clicks the host, which never reaches the inner button.
it.runIf(referenceTargetSupported)(
	"label for the host activates the inner button",
	async () => {
		const form = document.createElement("form");
		const onSubmit = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener("submit", onSubmit);
		const label = document.createElement("label");
		label.htmlFor = "save";
		label.textContent = "Save changes";
		form.append(label);
		await mount({ id: "save", type: "submit" }, form);

		await userEvent.click(label);

		expect(onSubmit).toHaveBeenCalledOnce();
	},
);

it("aria attributes set later reach the inner button", async () => {
	const host = await mount();

	host.setAttribute("aria-label", "Save draft");

	await expect
		.poll(() =>
			host.shadowRoot?.querySelector("button")?.getAttribute("aria-label"),
		)
		.toBe("Save draft");
});
