import { Cite, plugins } from '@citation-js/core';
import '@citation-js/plugin-csl';
import { CrossRefClient, WorkMetadata } from '../api/crossref.js';

/**
 * Citation style type
 */
export type CitationStyle = 'apa' | 'vancouver' | 'harvard' | 'mla' | 'chicago';

/**
 * Map user-friendly style names to Citation.js template names
 */
const STYLE_MAP: Record<CitationStyle, string> = {
	apa: 'apa',
	vancouver: 'vancouver',
	harvard: 'harvard1',
	mla: 'apa', // Fallback to APA for MLA (similar format)
	chicago: 'apa', // Fallback to APA for Chicago (author-date similar)
};

/**
 * Output format type
 */
export type OutputFormat = 'text' | 'html' | 'rtf';

/**
 * Citation data input (CSL-JSON format or DOI)
 */
export interface CitationInput {
	title?: string;
	author?: Array<{ given?: string; family?: string }>;
	issued?: { 'date-parts'?: number[][] };
	'container-title'?: string;
	volume?: string;
	issue?: string;
	page?: string;
	publisher?: string;
	DOI?: string;
	URL?: string;
	type?: string;
	id?: string;
}

/**
 * Format a citation using Citation.js
 */
export async function formatCitation(params: {
	data: CitationInput | CitationInput[] | string;
	style: CitationStyle;
	format: OutputFormat;
	lang?: string;
}): Promise<string> {
	const { data, style, format = 'text', lang = 'en-US' } = params;

	try {
		let cite: Cite;

		if (typeof data === 'string') {
			if (data.startsWith('10.')) {
				cite = await Cite.async(data);
			} else {
				cite = new Cite(data);
			}
		} else {
			cite = new Cite(data);
		}

		const templateName = STYLE_MAP[style] || 'apa';

		return cite.format('bibliography', {
			format,
			template: templateName,
			lang,
		});
	} catch (error) {
		throw new Error(
			`Failed to format citation: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

/**
 * Convert CrossRef work metadata to CSL-JSON
 */
export function crossrefToCsl(work: WorkMetadata): CitationInput {
	const csl: CitationInput = {
		id: work.DOI,
		DOI: work.DOI,
		type: work.type || 'article',
		title: work.title?.[0],
		'container-title': work['container-title']?.[0],
		publisher: work.publisher,
		volume: work.volume,
		issue: work.issue,
		page: work.page,
		URL: work.URL,
	};

	if (work.author && work.author.length > 0) {
		csl.author = work.author.map((author) => ({
			given: author.given,
			family: author.family,
		}));
	}

	if (work.published?.['date-parts']?.[0]) {
		csl.issued = {
			'date-parts': [work.published['date-parts'][0]],
		};
	}

	return csl;
}

/**
 * Generate bibliography from multiple citations
 */
export async function generateBibliography(params: {
	citations: Array<CitationInput | string>;
	style: CitationStyle;
	format: OutputFormat;
	lang?: string;
	sort?: boolean;
}): Promise<string> {
	const {
		citations,
		style,
		format = 'text',
		lang = 'en-US',
		sort = true,
	} = params;

	try {
		const citeData = await Promise.all(
			citations.map(async (citation) => {
				if (
					typeof citation === 'string' &&
					citation.startsWith('10.')
				) {
					const cite = await Cite.async(citation);
					return cite.data[0];
				}
				return citation;
			})
		);

		const cite = new Cite(citeData);

		const templateName = STYLE_MAP[style] || 'apa';

		return cite.format('bibliography', {
			format,
			template: templateName,
			lang,
			nosort: !sort,
		});
	} catch (error) {
		throw new Error(
			`Failed to generate bibliography: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

/**
 * Convert citation to BibTeX format
 */
export async function convertToBibtex(
	data: CitationInput | CitationInput[] | string
): Promise<string> {
	try {
		let cite: Cite;

		if (typeof data === 'string') {
			if (data.startsWith('10.')) {
				cite = await Cite.async(data);
			} else {
				cite = new Cite(data);
			}
		} else {
			cite = new Cite(data);
		}

		return cite.format('bibtex');
	} catch (error) {
		throw new Error(
			`Failed to convert to BibTeX: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

/**
 * Validate a citation by checking required fields
 */
export function validateCitation(citation: CitationInput): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!citation.title) {
		errors.push('Missing required field: title');
	}

	if (!citation.author || citation.author.length === 0) {
		errors.push('Missing required field: author');
	}

	if (
		!citation.issued ||
		!citation.issued['date-parts'] ||
		!citation.issued['date-parts'][0]
	) {
		errors.push('Missing required field: publication date');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Search for a work by DOI and return formatted citation
 */
export async function searchAndFormatDoi(params: {
	doi: string;
	style: CitationStyle;
	format: OutputFormat;
	lang?: string;
	mailto?: string;
}): Promise<{ citation: string; metadata: WorkMetadata }> {
	const { doi, style, format, lang, mailto } = params;

	try {
		const crossref = new CrossRefClient({ mailto });
		const work = await crossref.getWork(doi);

		const cslData = crossrefToCsl(work);
		const citation = await formatCitation({
			data: cslData,
			style,
			format,
			lang,
		});

		return {
			citation,
			metadata: work,
		};
	} catch (error) {
		throw new Error(
			`Failed to search and format DOI: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

/**
 * Get in-text citation
 */
export async function getInTextCitation(params: {
	data: CitationInput | CitationInput[] | string;
	style: CitationStyle;
	format: OutputFormat;
	lang?: string;
}): Promise<string> {
	const { data, style, format = 'text', lang = 'en-US' } = params;

	try {
		let cite: Cite;

		if (typeof data === 'string') {
			if (data.startsWith('10.')) {
				cite = await Cite.async(data);
			} else {
				cite = new Cite(data);
			}
		} else {
			cite = new Cite(data);
		}

		return cite.format('citation', {
			format,
			template: style,
			lang,
		});
	} catch (error) {
		throw new Error(
			`Failed to format in-text citation: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}
