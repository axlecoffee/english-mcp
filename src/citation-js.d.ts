declare module '@citation-js/core' {
	export class Cite {
		constructor(data: any, options?: any);
		static async(input: any, options?: any): Promise<Cite>;

		format(
			format: string,
			options?: {
				format?: string;
				template?: string;
				lang?: string;
				nosort?: boolean;
				prepend?: string | ((entry: any) => string);
				append?: string | ((entry: any) => string);
				asEntryArray?: boolean;
			}
		): string;

		data: any[];
	}

	export const plugins: any;
}

declare module '@citation-js/plugin-csl' {
	const plugin: any;
	export default plugin;
}
