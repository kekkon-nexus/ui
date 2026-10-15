import { readFile } from "node:fs/promises";

import { createUnplugin } from "unplugin";
import { parse, type IDLRootType } from "webidl2";

const PREFIX = "virtual:reflected-attributes/";
const ELEMENT_REFERENCES = "virtual:element-references";

const parsed = new Map<string, Promise<IDLRootType[]>>();

/**
 * @param shortname a webref IDL file without its extension, e.g. `html`
 * @returns the parsed definitions, cached per file
 */
function idl(shortname: string): Promise<IDLRootType[]> {
	let definitions = parsed.get(shortname);
	if (!definitions) {
		definitions = readFile(
			new URL(import.meta.resolve(`@webref/idl/${shortname}.idl`)),
			"utf8",
		).then(parse);
		parsed.set(shortname, definitions);
	}
	return definitions;
}

/**
 * Reads the content attributes an HTML interface reflects from the spec's IDL:
 * `[Reflect] attribute DOMString name` gives "name", `[Reflect="value"] defaultValue` gives "value".
 * Only the resulting names ship; the IDL is parsed at build time.
 * `html.idl` keeps obsolete members in partial interfaces, so only the main interface is read.
 *
 * @param name the IDL interface, e.g. `HTMLInputElement`
 * @returns the reflected content attribute names
 */
async function reflected(name: string): Promise<string[]> {
	const definitions = await idl("html");
	return definitions
		.filter(
			(node) =>
				node.type === "interface" && !node.partial && node.name === name,
		)
		.flatMap((node) => (node.type === "interface" ? node.members : []))
		.flatMap((member) => {
			if (member.type !== "attribute") return [];
			const reflect = member.extAttrs.find(({ name }) =>
				name.startsWith("Reflect"),
			);
			if (!reflect) return [];
			return reflect.rhs?.type === "string"
				? [JSON.parse(reflect.rhs.value) as string]
				: [member.name.toLowerCase()];
		});
}

/**
 * Reads the attributes that name other elements by ID, with the properties that reflect them
 * as element references: `[Reflect="commandfor"] attribute Element? commandForElement` and
 * `[Reflect="aria-controls"] attribute FrozenArray<Element>? ariaControlsElements`.
 *
 * @returns `[attribute, property]` pairs for single and list references
 */
async function elementReferences(): Promise<{
	element: [string, string][];
	list: [string, string][];
}> {
	const definitions = [...(await idl("html")), ...(await idl("wai-aria"))];
	const element = new Map<string, string>();
	const list = new Map<string, string>();
	for (const node of definitions) {
		if (node.type !== "interface" && node.type !== "interface mixin") continue;
		for (const member of node.members) {
			if (member.type !== "attribute") continue;
			const reflect = member.extAttrs.find(({ name }) => name === "Reflect");
			if (reflect?.rhs?.type !== "string") continue;
			const attribute = JSON.parse(reflect.rhs.value) as string;
			const type = member.idlType;
			if (type.generic === "" && type.idlType === "Element") {
				element.set(attribute, member.name);
			} else if (
				type.generic === "FrozenArray" &&
				type.idlType[0].idlType === "Element"
			) {
				list.set(attribute, member.name);
			}
		}
	}
	return { element: [...element], list: [...list] };
}

export const reflectedAttributes: ReturnType<typeof createUnplugin> =
	createUnplugin(() => ({
		name: "reflected-attributes",
		resolveId: (id) =>
			id.startsWith(PREFIX) || id === ELEMENT_REFERENCES
				? `\0${id}`
				: undefined,
		async load(id) {
			if (id === `\0${ELEMENT_REFERENCES}`) {
				const { element, list } = await elementReferences();
				return `export const elementProperties = ${JSON.stringify(element)};
export const elementListProperties = ${JSON.stringify(list)};`;
			}
			if (!id.startsWith(`\0${PREFIX}`)) return;
			const names = await reflected(id.slice(PREFIX.length + 1));
			return `export default ${JSON.stringify(names)};`;
		},
	}));
