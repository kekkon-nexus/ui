export type Control =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement;

const CONTROL = "input, select, textarea";

/** `invalid` does not bubble, so these are listened for in the capture phase. */
export const EVENTS: string[] = ["input", "change", "focusout", "invalid"];

export function getControl(field: Element | null): Control | undefined {
	return field?.querySelector<Control>(CONTROL) ?? undefined;
}

export function setState(
	internals: ElementInternals,
	name: string,
	on: boolean,
): void {
	if (on) internals.states.add(name);
	else internals.states.delete(name);
}
