import { getElement, type MixedInCtor } from "@stencil/core";

type Control = HTMLInputElement;

/**
 * Mirrors the native control inside the shadow root into `ElementInternals`, since a control
 * in a shadow root is not associated with the page's form.
 */
export interface FormAssociationMembers {
	internals: ElementInternals;
	value: string;
	controlRef: (control?: Control) => void;
	syncControl: () => void;
	onControlChange: () => void;
}

export const FormAssociation = <B extends MixedInCtor>(
	Base: B,
): B & MixedInCtor<FormAssociationMembers> => {
	class FormAssociation extends Base {
		/**
		 * Workaround: `@stencil/unplugin` skips files whose only Stencil decorator is
		 * `@AttachInternals`, so each component attaches the internals itself.
		 */
		declare internals: ElementInternals;

		#control?: Control;
		#disabled = false;
		#observer = new MutationObserver(() => {
			this.syncControl();
		});

		get value(): string {
			return this.#control?.value ?? "";
		}

		set value(value: string) {
			if (!this.#control) return;
			this.#control.value = value;
			this.syncControl();
		}

		controlRef = (control?: Control): void => {
			this.#observer.disconnect();
			this.#control = control;
			if (!control) return;
			control.disabled = this.#disabled;
			// Forwarded attributes like `required` and `pattern` change validity without an input event.
			this.#observer.observe(control, { attributes: true });
			this.syncControl();
		};

		syncControl = (): void => {
			const control = this.#control;
			if (!control) return;
			this.internals.setFormValue(control.value, control.value);
			this.internals.setValidity(
				control.validity,
				control.validationMessage,
				control,
			);
		};

		/** `change` is not composed, so it stops at the shadow root. */
		onControlChange = (): void => {
			this.syncControl();
			getElement(this).dispatchEvent(new Event("change", { bubbles: true }));
		};

		formDisabledCallback(disabled: boolean): void {
			this.#disabled = disabled;
			if (!this.#control) return;
			this.#control.disabled = disabled;
		}

		formResetCallback(): void {
			if (!this.#control) return;
			this.#control.value = this.#control.defaultValue;
			this.syncControl();
		}

		formStateRestoreCallback(state: File | FormData | string | null): void {
			if (typeof state === "string") this.value = state;
		}
	}

	return FormAssociation;
};
