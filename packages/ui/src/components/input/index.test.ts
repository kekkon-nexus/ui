import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import "@/components/input/define";

const referenceTargetSupported = "referenceTarget" in ShadowRoot.prototype;

async function mount(
	attributes: Record<string, string> = {},
	parent?: Element,
): Promise<HTMLKnuiInputElement> {
	const host = document.createElement("knui-input");
	for (const [name, value] of Object.entries(attributes)) {
		host.setAttribute(name, value);
	}
	document.body.replaceChildren(parent ?? host);
	parent?.append(host);
	await expect.poll(() => host.shadowRoot?.querySelector("input")).toBeTruthy();
	return host;
}

function control(host: HTMLElement): HTMLInputElement {
	const input = host.shadowRoot?.querySelector("input");
	if (!input) throw new Error("no inner input");
	return input;
}

it("typing submits with the owning form", async () => {
	const form = document.createElement("form");
	const host = await mount({ name: "query" }, form);

	await userEvent.type(host, "hello");

	expect(host.value).toBe("hello");
	expect(new FormData(form).get("query")).toBe("hello");
});

it("input attributes on the host reach the inner input", async () => {
	const host = await mount({ placeholder: "Search", type: "email" });

	host.setAttribute("maxlength", "5");

	await expect
		.poll(() => {
			const input = control(host);
			return [input.placeholder, input.type, input.maxLength];
		})
		.toEqual(["Search", "email", 5]);
});

it("the value attribute is the default value", async () => {
	const host = await mount({ value: "draft" });

	await expect.poll(() => host.value).toBe("draft");
});

it("required and empty is invalid until filled", async () => {
	const form = document.createElement("form");
	const host = await mount({ required: "" }, form);

	await expect.poll(() => host.matches(":invalid")).toBe(true);
	expect(form.checkValidity()).toBe(false);

	await userEvent.type(host, "x");

	expect(host.matches(":valid")).toBe(true);
	expect(form.checkValidity()).toBe(true);
});

it("validity follows attributes added later", async () => {
	const host = await mount();
	await expect.poll(() => host.matches(":valid")).toBe(true);

	host.setAttribute("required", "");

	await expect.poll(() => host.matches(":invalid")).toBe(true);
});

it("reset restores the default value", async () => {
	const form = document.createElement("form");
	const host = await mount({ value: "draft" }, form);
	await userEvent.type(host, "edited");
	expect(host.value).toBe("draftedited");

	form.reset();

	expect(host.value).toBe("draft");
});

it("a disabled fieldset disables the inner input", async () => {
	const fieldset = document.createElement("fieldset");
	fieldset.disabled = true;
	const host = await mount({}, fieldset);

	await expect.poll(() => control(host).disabled).toBe(true);
	expect(host.matches(":disabled")).toBe(true);
});

it("change reaches the host", async () => {
	const parent = document.createElement("div");
	const host = await mount({}, parent);
	parent.append(document.createElement("button"));
	const onChange = vi.fn();
	host.addEventListener("change", onChange);

	await userEvent.type(host, "x");
	await userEvent.tab();

	expect(onChange).toHaveBeenCalledOnce();
});

it("text styles on the host reach the inner input", async () => {
	const host = await mount();

	host.style.font = "italic 20px serif";
	host.style.color = "rgb(255, 0, 0)";

	const style = getComputedStyle(control(host));
	expect([style.fontStyle, style.fontSize, style.color]).toEqual([
		"italic",
		"20px",
		"rgb(255, 0, 0)",
	]);
});

// Without reference target the label clicks the host, which never reaches the inner input.
it.runIf(referenceTargetSupported)(
	"label for the host focuses the inner input",
	async () => {
		const label = document.createElement("label");
		label.htmlFor = "query";
		label.textContent = "Query";
		const parent = document.createElement("div");
		parent.append(label);
		const host = await mount({ id: "query" }, parent);

		await userEvent.click(label);

		expect(host.shadowRoot?.activeElement).toBe(control(host));
	},
);
