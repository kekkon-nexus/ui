import { Component, Prop } from "@stencil/core";
import type { JSX } from "@stencil/core/jsx-runtime";

@Component({
	tag: "knui-button",
	encapsulation: { type: "shadow" },
})
export class Button {
	@Prop() disabled = false;

	render(): JSX.Element {
		return (
			<button
				type="button"
				disabled={this.disabled}
			>
				<slot />
			</button>
		);
	}
}
