import { AttachInternals, Component, Mixin, Prop } from "@stencil/core";
import type { JSX } from "@stencil/core/jsx-runtime";

import { CONTROL_ID, ReferenceForwarding } from "@/mixins/reference-forwarding";

const Base: ReturnType<typeof Mixin<[typeof ReferenceForwarding]>> =
	Mixin(ReferenceForwarding);

@Component({
	tag: "knui-button",
	encapsulation: { type: "shadow" },
})
export class Button extends Base {
	@AttachInternals() internals!: ElementInternals;

	@Prop() disabled = false;

	@Prop() type: "button" | "reset" | "submit" = "button";

	#onClick = (): void => {
		const { form } = this.internals;
		if (this.type === "submit") form?.requestSubmit();
		else if (this.type === "reset") form?.reset();
	};

	render(): JSX.Element {
		return (
			<button
				id={CONTROL_ID}
				type="button"
				disabled={this.disabled}
				onClick={this.#onClick}
			>
				<slot />
			</button>
		);
	}
}
