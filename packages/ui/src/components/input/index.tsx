import { AttachInternals, Component, Mixin } from "@stencil/core";
import type { JSX } from "@stencil/core/jsx-runtime";
import reflected from "virtual:reflected-attributes/HTMLInputElement";

import { FormAssociation } from "@/mixins/form-association";
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

const Base: ReturnType<
	typeof Mixin<[typeof ReferenceForwarding, typeof FormAssociation]>
> = Mixin(ReferenceForwarding, FormAssociation);

@Component({
	tag: "knui-input",
	encapsulation: { type: "shadow", delegatesFocus: true },
})
export class Input extends Base {
	@AttachInternals() override internals!: ElementInternals;

	override copiesAttribute(name: string): boolean {
		if (INPUT_ATTRIBUTES.has(name)) return true;
		return super.copiesAttribute(name);
	}

	render(): JSX.Element {
		return (
			<input
				id={CONTROL_ID}
				ref={this.controlRef}
				onInput={this.syncControl}
				onChange={this.onControlChange}
			/>
		);
	}
}
