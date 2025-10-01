import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://en.wikipedia.org/w/api.php';

export interface WikipediaSearchResult {
	pageid: number;
	title: string;
	extract?: string;
	thumbnail?: {
		source: string;
		width: number;
		height: number;
	};
	fullurl?: string;
}

export interface WikipediaPage {
	pageid: number;
	title: string;
	extract: string;
	fullurl: string;
	categories?: string[];
	links?: Array<{ title: string }>;
}

/**
 * Client for Wikipedia MediaWiki API.
 * Free tier with no rate limits.
 */
export class WikipediaClient {
	/**
	 * Search for Wikipedia articles
	 */
	async search(query: string, limit: number = 10): Promise<string[]> {
		const params = new URLSearchParams({
			action: 'opensearch',
			search: query,
			limit: limit.toString(),
			format: 'json',
			origin: '*',
		});

		const url = `${BASE_URL}?${params.toString()}`;
		const result = await fetchJson(url);

		return result[1] || [];
	}

	/**
	 * Get article summary
	 */
	async getSummary(title: string): Promise<WikipediaPage> {
		const params = new URLSearchParams({
			action: 'query',
			prop: 'extracts|info|pageimages',
			exintro: '1',
			explaintext: '1',
			inprop: 'url',
			titles: title,
			format: 'json',
			origin: '*',
			piprop: 'thumbnail',
			pithumbsize: '300',
		});

		const url = `${BASE_URL}?${params.toString()}`;
		const result = await fetchJson(url);

		const pages = result.query?.pages || {};
		const pageId = Object.keys(pages)[0];
		const page = pages[pageId];

		if (!page || page.missing) {
			throw new Error(`Article not found: ${title}`);
		}

		return {
			pageid: page.pageid,
			title: page.title,
			extract: page.extract || '',
			fullurl: page.fullurl || '',
		};
	}

	/**
	 * Get full article content
	 */
	async getArticle(title: string): Promise<WikipediaPage> {
		const params = new URLSearchParams({
			action: 'query',
			prop: 'extracts|info|categories|links',
			explaintext: '1',
			inprop: 'url',
			titles: title,
			format: 'json',
			origin: '*',
		});

		const url = `${BASE_URL}?${params.toString()}`;
		const result = await fetchJson(url);

		const pages = result.query?.pages || {};
		const pageId = Object.keys(pages)[0];
		const page = pages[pageId];

		if (!page || page.missing) {
			throw new Error(`Article not found: ${title}`);
		}

		return {
			pageid: page.pageid,
			title: page.title,
			extract: page.extract || '',
			fullurl: page.fullurl || '',
			categories: page.categories?.map((c: any) => c.title) || [],
			links: page.links || [],
		};
	}

	/**
	 * Search and get summaries for multiple articles
	 */
	async searchWithSummaries(
		query: string,
		limit: number = 5
	): Promise<WikipediaSearchResult[]> {
		const titles = await this.search(query, limit);

		const params = new URLSearchParams({
			action: 'query',
			prop: 'extracts|info|pageimages',
			exintro: '1',
			explaintext: '1',
			inprop: 'url',
			titles: titles.join('|'),
			format: 'json',
			origin: '*',
			piprop: 'thumbnail',
			pithumbsize: '150',
		});

		const url = `${BASE_URL}?${params.toString()}`;
		const result = await fetchJson(url);

		const pages = result.query?.pages || {};
		return Object.values(pages).map((page: any) => ({
			pageid: page.pageid,
			title: page.title,
			extract: page.extract,
			thumbnail: page.thumbnail,
			fullurl: page.fullurl,
		}));
	}
}
