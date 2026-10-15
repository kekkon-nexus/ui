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

	@Prop() focusableWhenDisabled = false;

	@Prop() type: "button" | "reset" | "submit" = "button";

	#onClick = (event: MouseEvent): void => {
		if (this.disabled) {
			// Canceling the click also cancels `command` and `popovertarget` activation.
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}

		const { form } = this.internals;
		if (this.type === "submit") form?.requestSubmit();
		else if (this.type === "reset") form?.reset();
	};

	#onKeyDown = (event: KeyboardEvent): void => {
		// Only Space is canceled, to stop the page scrolling.
		// Canceling every key would also swallow the arrow keys
		// a surrounding `focusgroup` moves focus with.
		if (this.disabled && event.key === " ") event.preventDefault();
	};

	#onPointerDown = (event: PointerEvent): void => {
		if (this.disabled) event.preventDefault();
	};

	render(): JSX.Element {
		return (
			<button
				id={CONTROL_ID}
				type="button"
				disabled={this.disabled && !this.focusableWhenDisabled}
				aria-disabled={
					this.disabled && this.focusableWhenDisabled ? "true" : undefined
				}
				onClick={this.#onClick}
				onKeyDown={this.#onKeyDown}
				onPointerDown={this.#onPointerDown}
			>
				<slot />
			</button>
		);
	}
}
