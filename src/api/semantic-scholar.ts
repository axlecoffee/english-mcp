import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.semanticscholar.org';
const MAX_RETRIES = 10;
const RETRY_DELAY = 30000;

export interface SemanticScholarConfig {
	apiKey?: string;
}

export interface PaperMetadata {
	paperId: string;
	corpusId?: number;
	title: string;
	abstract?: string;
	year?: number;
	authors?: Array<{
		authorId: string;
		name: string;
	}>;
	venue?: string;
	publicationVenue?: {
		name: string;
		type?: string;
	};
	citationCount?: number;
	referenceCount?: number;
	influentialCitationCount?: number;
	isOpenAccess?: boolean;
	openAccessPdf?: {
		url: string;
		status?: string;
	};
	fieldsOfStudy?: string[];
	publicationTypes?: string[];
	journal?: {
		name: string;
		volume?: string;
		pages?: string;
	};
	externalIds?: {
		DOI?: string;
		ArXiv?: string;
		PubMed?: string;
		MAG?: string;
		DBLP?: string;
		ACL?: string;
		CorpusId?: number;
	};
	url?: string;
}

export interface SearchResults {
	total: number;
	offset: number;
	next?: number;
	data: PaperMetadata[];
}

export interface AuthorMetadata {
	authorId: string;
	name: string;
	affiliations?: string[];
	homepage?: string;
	paperCount?: number;
	citationCount?: number;
	hIndex?: number;
}

/**
 * Client for Semantic Scholar Academic Graph API.
 */
export class SemanticScholarClient {
	private apiKey?: string;

	constructor(config: SemanticScholarConfig = {}) {
		this.apiKey = config.apiKey;
	}

	private async request<T>(
		endpoint: string,
		options: {
			method?: 'GET' | 'POST';
			body?: Record<string, unknown>;
			retries?: number;
		} = {}
	): Promise<T> {
		const { method = 'GET', body, retries = 0 } = options;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.apiKey) {
			headers['x-api-key'] = this.apiKey;
		}

		try {
			const url = `${BASE_URL}${endpoint}`;

			const fetchOptions: RequestInit = {
				method,
				headers,
			};

			if (method === 'POST' && body) {
				fetchOptions.body = JSON.stringify(body);
			}

			return (await fetchJson(url, fetchOptions)) as T;
		} catch (error) {
			const statusCode =
				error &&
				typeof error === 'object' &&
				'message' in error &&
				typeof error.message === 'string' &&
				error.message.includes('status: 429')
					? 429
					: 0;

			if (statusCode === 429 && retries < MAX_RETRIES) {
				await new Promise((resolve) =>
					setTimeout(resolve, RETRY_DELAY)
				);
				return this.request<T>(endpoint, {
					...options,
					retries: retries + 1,
				});
			}

			throw error;
		}
	}

	/**
	 * Get metadata for a single paper by ID
	 */
	async getPaper(paperId: string, fields?: string[]): Promise<PaperMetadata> {
		const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
		return this.request<PaperMetadata>(
			`/graph/v1/paper/${paperId}${fieldParam}`
		);
	}

	/**
	 * Get metadata for multiple papers by IDs (max 500)
	 */
	async getPapers(
		paperIds: string[],
		fields?: string[]
	): Promise<PaperMetadata[]> {
		if (paperIds.length > 500) {
			throw new Error('Maximum 500 paper IDs allowed per batch request');
		}

		const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
		return this.request<PaperMetadata[]>(
			`/graph/v1/paper/batch${fieldParam}`,
			{
				method: 'POST',
				body: { ids: paperIds },
			}
		);
	}

	/**
	 * Search for papers by keyword query
	 */
	async searchPapers(params: {
		query: string;
		year?: string;
		publicationType?: string[];
		openAccessPdf?: boolean;
		fields?: string[];
		offset?: number;
		limit?: number;
	}): Promise<SearchResults> {
		const queryParams = new URLSearchParams();
		queryParams.set('query', params.query);

		if (params.year) queryParams.set('year', params.year);
		if (params.publicationType)
			queryParams.set(
				'publicationType',
				params.publicationType.join(',')
			);
		if (params.openAccessPdf !== undefined)
			queryParams.set('openAccessPdf', params.openAccessPdf.toString());
		if (params.fields) queryParams.set('fields', params.fields.join(','));
		if (params.offset !== undefined)
			queryParams.set('offset', params.offset.toString());
		if (params.limit !== undefined)
			queryParams.set('limit', params.limit.toString());

		return this.request<SearchResults>(
			`/graph/v1/paper/search?${queryParams.toString()}`
		);
	}

	/**
	 * Get citations for a paper
	 */
	async getPaperCitations(
		paperId: string,
		fields?: string[],
		limit?: number
	): Promise<{ data: Array<{ citingPaper: PaperMetadata }> }> {
		const params = new URLSearchParams();
		if (fields) params.set('fields', fields.join(','));
		if (limit !== undefined) params.set('limit', limit.toString());

		const queryString = params.toString();
		return this.request(
			`/graph/v1/paper/${paperId}/citations${
				queryString ? `?${queryString}` : ''
			}`
		);
	}

	/**
	 * Get references for a paper
	 */
	async getPaperReferences(
		paperId: string,
		fields?: string[],
		limit?: number
	): Promise<{ data: Array<{ citedPaper: PaperMetadata }> }> {
		const params = new URLSearchParams();
		if (fields) params.set('fields', fields.join(','));
		if (limit !== undefined) params.set('limit', limit.toString());

		const queryString = params.toString();
		return this.request(
			`/graph/v1/paper/${paperId}/references${
				queryString ? `?${queryString}` : ''
			}`
		);
	}

	/**
	 * Get metadata for an author
	 */
	async getAuthor(
		authorId: string,
		fields?: string[]
	): Promise<AuthorMetadata> {
		const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
		return this.request<AuthorMetadata>(
			`/graph/v1/author/${authorId}${fieldParam}`
		);
	}

	/**
	 * Search for authors by name
	 */
	async searchAuthors(params: {
		query: string;
		fields?: string[];
		offset?: number;
		limit?: number;
	}): Promise<{ data: AuthorMetadata[] }> {
		const queryParams = new URLSearchParams();
		queryParams.set('query', params.query);

		if (params.fields) queryParams.set('fields', params.fields.join(','));
		if (params.offset !== undefined)
			queryParams.set('offset', params.offset.toString());
		if (params.limit !== undefined)
			queryParams.set('limit', params.limit.toString());

		return this.request<{ data: AuthorMetadata[] }>(
			`/graph/v1/author/search?${queryParams.toString()}`
		);
	}

	/**
	 * Get recommended papers for a paper
	 */
	async getRecommendedPapers(
		paperId: string,
		fields?: string[]
	): Promise<{ recommendedPapers: PaperMetadata[] }> {
		const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
		return this.request<{ recommendedPapers: PaperMetadata[] }>(
			`/recommendations/v1/papers/forpaper/${paperId}${fieldParam}`
		);
	}
}
