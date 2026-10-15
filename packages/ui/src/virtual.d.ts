declare module "virtual:reflected-attributes/*" {
	const attributes: string[];
	export default attributes;
}

declare module "virtual:element-references" {
	export const elementProperties: [attribute: string, property: string][];
	export const elementListProperties: [attribute: string, property: string][];
}
