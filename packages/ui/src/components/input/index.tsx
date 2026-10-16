import { AttachInternals, Component, Mixin } from "@stencil/core";
import type { JSX } from "@stencil/core/jsx-runtime";
import reflected from "virtual:reflected-attributes/HTMLInputElement";

import { FormAssociation } from "@/controllers/form-association";
import { CONTROL_ID, ReferenceForwarding } from "@/mixins/reference-forwarding";

/**
 * `type` has a custom getter, so the IDL does not mark it as reflected. The rest are global
 * attributes that matter on a text control.
 */
const INCLUDED = [
	"autocapitalize",
	"autocorrect",
	"enterkeyhint",
	"inputmode",
	"spellcheck",
	"type",
];

/**
 * `disabled` comes from `formDisabledCallback`, which also covers `<fieldset disabled>`.
 * The others only act on checkboxes or submit inputs.
 */
const EXCLUDED = new Set([
	"checked",
	"disabled",
	"formaction",
	"formnovalidate",
	"formtarget",
]);

const INPUT_ATTRIBUTES = new Set([
	...reflected.filter((name) => !EXCLUDED.has(name)),
	...INCLUDED,
]);

declare global {
	/** Stencil generates element types from `@Prop`s and `@Method`s only. */
	interface HTMLKnuiInputElement {
		value: string;
	}
}

const Base: ReturnType<typeof Mixin<[typeof ReferenceForwarding]>> =
	Mixin(ReferenceForwarding);

@Component({
	tag: "knui-input",
	encapsulation: { type: "shadow", delegatesFocus: true },
	// The host is the box consumers style. `part="control"` reaches what the host cannot:
	// `::placeholder`, `::selection` and `:autofill`.
	styles: `
		:host {
			display: inline-block;
		}
		input {
			all: unset;
			display: block;
			box-sizing: border-box;
			inline-size: 100%;
		}
	`,
})
export class Input extends Base {
	@AttachInternals() internals!: ElementInternals;

	#form = new FormAssociation(this);

	get value(): string {
		return this.#form.value;
	}

	set value(value: string) {
		this.#form.value = value;
	}

	formDisabledCallback(disabled: boolean): void {
		this.#form.disable(disabled);
	}

	formResetCallback(): void {
		this.#form.reset();
	}

	formStateRestoreCallback(state: File | FormData | string | null): void {
		this.#form.restore(state);
	}

	override copiesAttribute(name: string): boolean {
		if (INPUT_ATTRIBUTES.has(name)) return true;
		return super.copiesAttribute(name);
	}

	render(): JSX.Element {
		return (
			<input
				id={CONTROL_ID}
				part="control"
				ref={this.#form.ref}
				onInput={this.#form.sync}
				onChange={this.#form.change}
			/>
		);
	}
}
