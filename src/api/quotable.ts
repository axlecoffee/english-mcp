import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.quotable.io';

export interface Quote {
	_id: string;
	content: string;
	author: string;
	tags: string[];
	authorSlug: string;
	length: number;
	dateAdded: string;
	dateModified: string;
}

export interface QuoteSearchResults {
	count: number;
	totalCount: number;
	page: number;
	totalPages: number;
	results: Quote[];
}

export interface Author {
	_id: string;
	name: string;
	bio?: string;
	description?: string;
	link?: string;
	quoteCount: number;
	slug: string;
}

/**
 * Client for Quotable API.
 * Free tier: 180 requests/min
 */
export class QuotableClient {
	/**
	 * Get a random quote
	 */
	async getRandomQuote(params?: {
		author?: string;
		tags?: string[];
		minLength?: number;
		maxLength?: number;
	}): Promise<Quote> {
		const queryParams = new URLSearchParams();

		if (params?.author) queryParams.set('author', params.author);
		if (params?.tags) queryParams.set('tags', params.tags.join(','));
		if (params?.minLength)
			queryParams.set('minLength', params.minLength.toString());
		if (params?.maxLength)
			queryParams.set('maxLength', params.maxLength.toString());

		const queryString = queryParams.toString();
		const url = `${BASE_URL}/random${queryString ? `?${queryString}` : ''}`;

		return fetchJson(url);
	}

	/**
	 * Search for quotes
	 */
	async searchQuotes(params: {
		query?: string;
		author?: string;
		tags?: string | string[];
		minLength?: number;
		maxLength?: number;
		limit?: number;
		page?: number;
	}): Promise<QuoteSearchResults> {
		const queryParams = new URLSearchParams();

		if (params.query) queryParams.set('query', params.query);
		if (params.author) queryParams.set('author', params.author);
		if (params.tags) {
			const tags = Array.isArray(params.tags)
				? params.tags.join(',')
				: params.tags;
			queryParams.set('tags', tags);
		}
		if (params.minLength)
			queryParams.set('minLength', params.minLength.toString());
		if (params.maxLength)
			queryParams.set('maxLength', params.maxLength.toString());
		if (params.limit) queryParams.set('limit', params.limit.toString());
		if (params.page) queryParams.set('page', params.page.toString());

		const url = `${BASE_URL}/quotes?${queryParams.toString()}`;
		return fetchJson(url);
	}

	/**
	 * Get quote by ID
	 */
	async getQuote(id: string): Promise<Quote> {
		return fetchJson(`${BASE_URL}/quotes/${id}`);
	}

	/**
	 * List all authors
	 */
	async listAuthors(params?: {
		slug?: string;
		limit?: number;
		page?: number;
	}): Promise<{
		count: number;
		totalCount: number;
		page: number;
		totalPages: number;
		results: Author[];
	}> {
		const queryParams = new URLSearchParams();

		if (params?.slug) queryParams.set('slug', params.slug);
		if (params?.limit) queryParams.set('limit', params.limit.toString());
		if (params?.page) queryParams.set('page', params.page.toString());

		const queryString = queryParams.toString();
		const url = `${BASE_URL}/authors${
			queryString ? `?${queryString}` : ''
		}`;

		return fetchJson(url);
	}

	/**
	 * Get quotes by author
	 */
	async getQuotesByAuthor(
		authorSlug: string,
		limit: number = 10
	): Promise<Quote[]> {
		const result = await this.searchQuotes({ author: authorSlug, limit });
		return result.results;
	}

	/**
	 * Get quotes by tag
	 */
	async getQuotesByTag(tag: string, limit: number = 10): Promise<Quote[]> {
		const result = await this.searchQuotes({ tags: tag, limit });
		return result.results;
	}

	/**
	 * List available tags
	 */
	async listTags(): Promise<
		Array<{ _id: string; name: string; quoteCount: number }>
	> {
		return fetchJson(`${BASE_URL}/tags`);
	}
}
