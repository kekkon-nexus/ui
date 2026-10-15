import { AttachInternals, Component, Prop, Watch } from "@stencil/core";

@Component({
	tag: "knui-separator",
	encapsulation: { type: "shadow" },
	styles: ":host { display: block; }",
})
export class Separator {
	@AttachInternals({ formAssociated: false }) internals!: ElementInternals;

	@Prop({ reflect: true }) orientation: "horizontal" | "vertical" =
		"horizontal";

	@Watch("orientation")
	orientationChanged(): void {
		this.internals.ariaOrientation = this.orientation;
	}

	componentWillLoad(): void {
		this.internals.role = "separator";
		this.orientationChanged();
	}
}
