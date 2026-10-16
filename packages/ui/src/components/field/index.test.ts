import { expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import "@/components/field/define";

async function mount(control: string): Promise<{
	field: HTMLElement;
	input: HTMLInputElement;
	form: HTMLFormElement;
	errors: Record<string, HTMLElement>;
}> {
	document.body.innerHTML = `
		<form>
			<knui-field>
				<label>Email ${control}</label>
				<knui-field-error match="valueMissing">Required</knui-field-error>
				<knui-field-error match="typeMismatch">Not an email</knui-field-error>
				<knui-field-error match="customError">Taken</knui-field-error>
			</knui-field>
			<button>Submit</button>
		</form>
	`;
	const field = document.querySelector<HTMLElement>("knui-field");
	const input = document.querySelector("input");
	const form = document.querySelector("form");
	if (!field || !input || !form) throw new Error("not mounted");
	const errors = Object.fromEntries(
		[...document.querySelectorAll<HTMLElement>("knui-field-error")].map(
			(error) => [error.getAttribute("match") ?? "", error],
		),
	);
	await customElements.whenDefined("knui-field");
	await customElements.whenDefined("knui-field-error");
	return { field, input, form, errors };
}

function shown(errors: Record<string, HTMLElement>): string[] {
	return Object.entries(errors)
		.filter(([, error]) => !error.hidden && error.matches(":state(shown)"))
		.map(([key]) => key);
}

it("touched after the control loses focus", async () => {
	const { field, input } = await mount(`<input>`);
	expect(field.matches(":state(touched)")).toBe(false);

	await userEvent.click(input);
	await userEvent.tab();

	expect(field.matches(":state(touched)")).toBe(true);
});

it("filled follows the value, including the initial one", async () => {
	const { field, input } = await mount(`<input value="draft">`);
	await expect.poll(() => field.matches(":state(filled)")).toBe(true);

	await userEvent.clear(input);

	expect(field.matches(":state(filled)")).toBe(false);
});

it("dirty while the value differs from the initial one", async () => {
	const { field, input } = await mount(`<input value="a">`);

	await userEvent.type(input, "b");
	expect(field.matches(":state(dirty)")).toBe(true);

	await userEvent.keyboard("{Backspace}");
	expect(field.matches(":state(dirty)")).toBe(false);
});

it("errors stay hidden before interaction", async () => {
	const { errors } = await mount(`<input type="email" required>`);

	expect(shown(errors)).toEqual([]);
});

it("only the error matching the validity shows after interaction", async () => {
	const { input, errors } = await mount(`<input type="email" required>`);

	await userEvent.type(input, "nope");
	await userEvent.tab();

	expect(shown(errors)).toEqual(["typeMismatch"]);
});

it("submitting shows errors on an untouched field", async () => {
	const { form, errors } = await mount(`<input type="email" required>`);

	form.requestSubmit();

	await expect.poll(() => shown(errors)).toEqual(["valueMissing"]);
});

it("aria-invalid follows user-invalid", async () => {
	const { input } = await mount(`<input type="email">`);

	await userEvent.type(input, "nope");
	await userEvent.tab();
	expect(input.getAttribute("aria-invalid")).toBe("true");

	await userEvent.clear(input);
	await userEvent.type(input, "a@b.c");
	expect(input.hasAttribute("aria-invalid")).toBe(false);
});

it("a custom validity message shows its error", async () => {
	const { input, errors } = await mount(`<input>`);
	input.addEventListener("input", () => {
		input.setCustomValidity(input.value === "admin" ? "Taken" : "");
	});

	await userEvent.type(input, "admin");
	await userEvent.tab();

	expect(shown(errors)).toEqual(["customError"]);
});
