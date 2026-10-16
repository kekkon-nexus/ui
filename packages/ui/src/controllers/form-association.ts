import { getElement } from "@stencil/core";

type Control = HTMLInputElement;

interface Host {
	internals: ElementInternals;
}

/**
 * Mirrors the native control inside the shadow root into `ElementInternals`, since a control
 * in a shadow root is not associated with the page's form. The component wires `ref`, `sync` and
 * `change` onto the control and forwards its form callbacks here, so none of it is public.
 */
export class FormAssociation {
	#host: Host;
	#control?: Control;
	#disabled = false;
	#observer = new MutationObserver(() => {
		this.sync();
	});

	constructor(host: Host) {
		this.#host = host;
	}

	get value(): string {
		return this.#control?.value ?? "";
	}

	set value(value: string) {
		if (!this.#control) return;
		this.#control.value = value;
		this.sync();
	}

	ref = (control?: Control): void => {
		this.#observer.disconnect();
		this.#control = control;
		if (!control) return;
		control.disabled = this.#disabled;
		// Forwarded attributes like `required` and `pattern` change validity without an input event.
		this.#observer.observe(control, { attributes: true });
		this.sync();
	};

	sync = (): void => {
		const control = this.#control;
		if (!control) return;
		this.#host.internals.setFormValue(control.value, control.value);
		this.#host.internals.setValidity(
			control.validity,
			control.validationMessage,
			control,
		);
	};

	/** `change` is not composed, so it stops at the shadow root. */
	change = (): void => {
		this.sync();
		getElement(this.#host).dispatchEvent(
			new Event("change", { bubbles: true }),
		);
	};

	disable(disabled: boolean): void {
		this.#disabled = disabled;
		if (!this.#control) return;
		this.#control.disabled = disabled;
	}

	reset(): void {
		if (!this.#control) return;
		this.#control.value = this.#control.defaultValue;
		this.sync();
	}

	restore(state: File | FormData | string | null): void {
		if (typeof state === "string") this.value = state;
	}
}
