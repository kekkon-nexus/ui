import { getElement, getShadowRoot, type MixedInCtor } from "@stencil/core";
import {
	elementListProperties,
	elementProperties,
} from "virtual:element-references";

export const CONTROL_ID = "control";

// Interest invokers are not in the HTML spec yet, so its IDL has no `interestForElement`.
const ELEMENT_PROPERTIES = new Map([
	...elementProperties,
	["interestfor", "interestForElement"],
]);

const ELEMENT_LIST_PROPERTIES = new Map(elementListProperties);

const COPIED_ATTRIBUTES = new Set(["command", "popovertargetaction"]);

// An ID written on the host names an element in the host's tree, which an attribute on the
// control cannot reach from inside the shadow root. The element-reflecting properties can.
// ponytail: IDs resolve when the attribute is forwarded, so a target added or renamed afterwards
// is missed until the attribute changes or the host reconnects. Observe the root if that bites.
// oxlint-disable unicorn/no-null -- nullable DOM properties are cleared with `null`
function forward(
	host: HTMLElement,
	control: Element,
	name: string,
	copies: (name: string) => boolean,
): void {
	const value = host.getAttribute(name);
	const root = host.getRootNode() as Document | ShadowRoot;
	const find = (id: string): Element | null =>
		root.querySelector(`#${CSS.escape(id)}`);
	const elementProperty = ELEMENT_PROPERTIES.get(name);
	const elementListProperty = ELEMENT_LIST_PROPERTIES.get(name);

	if (elementProperty) {
		Reflect.set(control, elementProperty, value === null ? null : find(value));
	} else if (elementListProperty) {
		Reflect.set(
			control,
			elementListProperty,
			value === null
				? null
				: value
						.split(/\s+/)
						.filter((id) => id !== "")
						.map((id) => find(id))
						.filter((element) => element !== null),
		);
	} else if (copies(name)) {
		if (value === null) control.removeAttribute(name);
		else control.setAttribute(name, value);
	}
}
// oxlint-enable unicorn/no-null

function getControl(host: HTMLElement): Element | undefined {
	return getShadowRoot(host)?.querySelector(`#${CONTROL_ID}`) ?? undefined;
}

function sync(host: HTMLElement, copies: (name: string) => boolean): void {
	const control = getControl(host);
	if (!control || !host.isConnected) return;

	const shadowRoot = getShadowRoot(host);
	// Reference target is behind a flag and absent from the DOM typings.
	if (shadowRoot && "referenceTarget" in shadowRoot) {
		Reflect.set(shadowRoot, "referenceTarget", CONTROL_ID);
	}

	for (const name of host.getAttributeNames()) {
		forward(host, control, name, copies);
	}
}

export interface ReferenceForwardingMembers {
	copiesAttribute(name: string): boolean;
}

export const ReferenceForwarding = <B extends MixedInCtor>(
	Base: B,
): B & MixedInCtor<ReferenceForwardingMembers> => {
	class ReferenceForwarding extends Base {
		#observer?: MutationObserver;

		/**
		 * Components with more native attributes than a button widen this.
		 *
		 * @param name an attribute on the host
		 * @returns whether the attribute is copied onto the inner control
		 */
		copiesAttribute(name: string): boolean {
			return COPIED_ATTRIBUTES.has(name) || name.startsWith("aria-");
		}

		#copies = (name: string): boolean => this.copiesAttribute(name);

		connectedCallback(): void {
			const host = getElement(this);
			this.#observer = new MutationObserver((records) => {
				const control = getControl(host);
				if (!control) return;
				for (const { attributeName } of records) {
					if (attributeName) {
						forward(host, control, attributeName, this.#copies);
					}
				}
			});
			this.#observer.observe(host, { attributes: true });
			sync(host, this.#copies);
		}

		disconnectedCallback(): void {
			this.#observer?.disconnect();
		}

		componentDidLoad(): void {
			sync(getElement(this), this.#copies);
		}
	}

	return ReferenceForwarding;
};
