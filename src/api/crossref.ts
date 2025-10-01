import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.crossref.org';

export interface CrossRefConfig {
	mailto?: string;
	plusApiToken?: string;
}

export interface WorkMetadata {
	DOI: string;
	title?: string[];
	author?: Array<{
		given?: string;
		family?: string;
		sequence?: string;
		affiliation?: Array<{ name: string }>;
	}>;
	'container-title'?: string[];
	published?: {
		'date-parts'?: number[][];
	};
	publisher?: string;
	volume?: string;
	issue?: string;
	page?: string;
	type?: string;
	ISSN?: string[];
	ISBN?: string[];
	URL?: string;
	abstract?: string;
	'reference-count'?: number;
	'is-referenced-by-count'?: number;
	subject?: string[];
	license?: Array<{
		URL: string;
		'content-version': string;
		'delay-in-days': number;
	}>;
	link?: Array<{
		URL: string;
		'content-type': string;
		'intended-application': string;
	}>;
}

export interface SearchResults {
	status: string;
	'message-type': string;
	'message-version': string;
	message: {
		'total-results': number;
		items: WorkMetadata[];
		query?: {
			'search-terms'?: string;
			'start-index'?: number;
		};
		'items-per-page'?: number;
	};
}

/**
 * Client for CrossRef REST API.
 * Implements polite pool access with automatic rate limit handling.
 */
export class CrossRefClient {
	private mailto?: string;
	private plusApiToken?: string;

	constructor(config: CrossRefConfig = {}) {
		this.mailto = config.mailto;
		this.plusApiToken = config.plusApiToken;
	}

	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.plusApiToken) {
			headers['Crossref-Plus-API-Token'] = this.plusApiToken;
		}

		if (this.mailto && !this.plusApiToken) {
			headers['User-Agent'] = `english-mcp/3.0.0 (mailto:${this.mailto})`;
		}

		return headers;
	}

	private async request<T>(
		endpoint: string,
		params: URLSearchParams = new URLSearchParams()
	): Promise<T> {
		if (this.mailto && !params.has('mailto')) {
			params.set('mailto', this.mailto);
		}

		const queryString = params.toString();
		const url = `${BASE_URL}${endpoint}${
			queryString ? `?${queryString}` : ''
		}`;

		return (await fetchJson(url, {
			headers: this.buildHeaders(),
		})) as T;
	}

	/**
	 * Get metadata for a single DOI
	 */
	async getWork(doi: string, select?: string[]): Promise<WorkMetadata> {
		const encodedDoi = encodeURIComponent(doi);
		const params = new URLSearchParams();

		if (select && select.length > 0) {
			params.set('select', select.join(','));
		}

		const result = await this.request<{
			status: string;
			message: WorkMetadata;
		}>(`/works/${encodedDoi}`, params);

		return result.message;
	}

	/**
	 * Check if a DOI is registered with CrossRef
	 */
	async checkDoi(doi: string): Promise<boolean> {
		try {
			await this.getWork(doi);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get the registration agency for a DOI
	 */
	async getAgency(
		doi: string
	): Promise<{ DOI: string; agency: { id: string; label: string } }> {
		const encodedDoi = encodeURIComponent(doi);
		const result = await this.request<{
			message: { DOI: string; agency: { id: string; label: string } };
		}>(`/works/${encodedDoi}/agency`);

		return result.message;
	}

	/**
	 * Search for works using free-form query
	 */
	async searchWorks(params: {
		query?: string;
		queryAuthor?: string;
		queryBibliographic?: string;
		queryContainerTitle?: string;
		filter?: Record<string, string>;
		rows?: number;
		offset?: number;
		cursor?: string;
		sort?: string;
		order?: 'asc' | 'desc';
		select?: string[];
	}): Promise<SearchResults> {
		const urlParams = new URLSearchParams();

		if (params.query) urlParams.set('query', params.query);
		if (params.queryAuthor)
			urlParams.set('query.author', params.queryAuthor);
		if (params.queryBibliographic)
			urlParams.set('query.bibliographic', params.queryBibliographic);
		if (params.queryContainerTitle)
			urlParams.set('query.container-title', params.queryContainerTitle);

		if (params.filter) {
			const filterParts = Object.entries(params.filter).map(
				([key, value]) => `${key}:${value}`
			);
			urlParams.set('filter', filterParts.join(','));
		}

		if (params.rows !== undefined)
			urlParams.set('rows', Math.min(params.rows, 1000).toString());
		if (params.offset !== undefined)
			urlParams.set('offset', params.offset.toString());
		if (params.cursor) urlParams.set('cursor', params.cursor);
		if (params.sort) urlParams.set('sort', params.sort);
		if (params.order) urlParams.set('order', params.order);
		if (params.select && params.select.length > 0)
			urlParams.set('select', params.select.join(','));

		return this.request<SearchResults>('/works', urlParams);
	}

	/**
	 * Get works by funder ID
	 */
	async getFunderWorks(
		funderId: string,
		rows?: number,
		offset?: number
	): Promise<SearchResults> {
		const params = new URLSearchParams();
		if (rows !== undefined) params.set('rows', rows.toString());
		if (offset !== undefined) params.set('offset', offset.toString());

		return this.request<SearchResults>(
			`/funders/${funderId}/works`,
			params
		);
	}

	/**
	 * Get works by member ID (publisher)
	 */
	async getMemberWorks(
		memberId: string,
		rows?: number,
		offset?: number
	): Promise<SearchResults> {
		const params = new URLSearchParams();
		if (rows !== undefined) params.set('rows', rows.toString());
		if (offset !== undefined) params.set('offset', offset.toString());

		return this.request<SearchResults>(
			`/members/${memberId}/works`,
			params
		);
	}

	/**
	 * Get works by journal ISSN
	 */
	async getJournalWorks(
		issn: string,
		rows?: number,
		offset?: number
	): Promise<SearchResults> {
		const params = new URLSearchParams();
		if (rows !== undefined) params.set('rows', rows.toString());
		if (offset !== undefined) params.set('offset', offset.toString());

		return this.request<SearchResults>(`/journals/${issn}/works`, params);
	}

	/**
	 * Search with bibliographic information (optimized for reference matching)
	 */
	async matchReference(bibliographic: string): Promise<WorkMetadata[]> {
		const result = await this.searchWorks({
			queryBibliographic: bibliographic,
			rows: 5,
		});

		return result.message.items;
	}
}
