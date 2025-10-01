import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.wordnik.com/v4';

export interface WordnikConfig {
	apiKey: string;
}

export interface Definition {
	text: string;
	partOfSpeech?: string;
	attributionText?: string;
	sourceDictionary?: string;
	word?: string;
}

export interface Example {
	text: string;
	title?: string;
	url?: string;
	year?: number;
}

export interface RelatedWord {
	relationshipType: string;
	words: string[];
}

export interface Pronunciation {
	raw: string;
	rawType?: string;
}

/**
 * Client for Wordnik API.
 * Free tier: 15,000 requests/hour
 */
export class WordnikClient {
	private apiKey: string;

	constructor(config: WordnikConfig) {
		this.apiKey = config.apiKey;
	}

	private buildUrl(
		path: string,
		params: URLSearchParams = new URLSearchParams()
	): string {
		params.set('api_key', this.apiKey);
		return `${BASE_URL}${path}?${params.toString()}`;
	}

	/**
	 * Get word definitions
	 */
	async getDefinitions(
		word: string,
		params?: {
			limit?: number;
			partOfSpeech?: string;
			sourceDictionaries?: string[];
		}
	): Promise<Definition[]> {
		const queryParams = new URLSearchParams();

		if (params?.limit) queryParams.set('limit', params.limit.toString());
		if (params?.partOfSpeech)
			queryParams.set('partOfSpeech', params.partOfSpeech);
		if (params?.sourceDictionaries) {
			queryParams.set(
				'sourceDictionaries',
				params.sourceDictionaries.join(',')
			);
		}

		const url = this.buildUrl(
			`/word.json/${encodeURIComponent(word)}/definitions`,
			queryParams
		);
		return fetchJson(url);
	}

	/**
	 * Get word examples
	 */
	async getExamples(
		word: string,
		limit: number = 5
	): Promise<{ examples: Example[] }> {
		const params = new URLSearchParams();
		params.set('limit', limit.toString());

		const url = this.buildUrl(
			`/word.json/${encodeURIComponent(word)}/examples`,
			params
		);
		return fetchJson(url);
	}

	/**
	 * Get related words (synonyms, antonyms, etc.)
	 */
	async getRelatedWords(
		word: string,
		relationshipTypes?: string[]
	): Promise<RelatedWord[]> {
		const params = new URLSearchParams();

		if (relationshipTypes) {
			params.set('relationshipTypes', relationshipTypes.join(','));
		}

		const url = this.buildUrl(
			`/word.json/${encodeURIComponent(word)}/relatedWords`,
			params
		);
		return fetchJson(url);
	}

	/**
	 * Get pronunciations
	 */
	async getPronunciations(word: string): Promise<Pronunciation[]> {
		const url = this.buildUrl(
			`/word.json/${encodeURIComponent(word)}/pronunciations`
		);
		return fetchJson(url);
	}

	/**
	 * Get word frequency
	 */
	async getFrequency(word: string): Promise<{
		word: string;
		frequency: Array<{ count: number; year: number }>;
	}> {
		const url = this.buildUrl(
			`/word.json/${encodeURIComponent(word)}/frequency`
		);
		return fetchJson(url);
	}

	/**
	 * Get word of the day
	 */
	async getWordOfTheDay(date?: string): Promise<{
		word: string;
		definitions: Definition[];
		examples?: Example[];
		note?: string;
	}> {
		const params = new URLSearchParams();
		if (date) params.set('date', date);

		const url = this.buildUrl('/words.json/wordOfTheDay', params);
		return fetchJson(url);
	}

	/**
	 * Get random words
	 */
	async getRandomWords(params?: {
		hasDictionaryDef?: boolean;
		minCorpusCount?: number;
		minLength?: number;
		maxLength?: number;
		limit?: number;
	}): Promise<Array<{ word: string }>> {
		const queryParams = new URLSearchParams();

		if (params?.hasDictionaryDef !== undefined) {
			queryParams.set(
				'hasDictionaryDef',
				params.hasDictionaryDef.toString()
			);
		}
		if (params?.minCorpusCount) {
			queryParams.set('minCorpusCount', params.minCorpusCount.toString());
		}
		if (params?.minLength)
			queryParams.set('minLength', params.minLength.toString());
		if (params?.maxLength)
			queryParams.set('maxLength', params.maxLength.toString());
		if (params?.limit) queryParams.set('limit', params.limit.toString());

		const url = this.buildUrl('/words.json/randomWords', queryParams);
		return fetchJson(url);
	}

	/**
	 * Search for words
	 */
	async searchWords(
		query: string,
		params?: {
			caseSensitive?: boolean;
			minCorpusCount?: number;
			maxCorpusCount?: number;
			minDictionaryCount?: number;
			maxDictionaryCount?: number;
			minLength?: number;
			maxLength?: number;
			limit?: number;
		}
	): Promise<{ searchResults: Array<{ word: string; count: number }> }> {
		const queryParams = new URLSearchParams();
		queryParams.set('query', query);

		if (params?.caseSensitive !== undefined) {
			queryParams.set('caseSensitive', params.caseSensitive.toString());
		}
		if (params?.minCorpusCount) {
			queryParams.set('minCorpusCount', params.minCorpusCount.toString());
		}
		if (params?.maxCorpusCount) {
			queryParams.set('maxCorpusCount', params.maxCorpusCount.toString());
		}
		if (params?.minDictionaryCount) {
			queryParams.set(
				'minDictionaryCount',
				params.minDictionaryCount.toString()
			);
		}
		if (params?.maxDictionaryCount) {
			queryParams.set(
				'maxDictionaryCount',
				params.maxDictionaryCount.toString()
			);
		}
		if (params?.minLength)
			queryParams.set('minLength', params.minLength.toString());
		if (params?.maxLength)
			queryParams.set('maxLength', params.maxLength.toString());
		if (params?.limit) queryParams.set('limit', params.limit.toString());

		const url = this.buildUrl('/words.json/search', queryParams);
		return fetchJson(url);
	}
}
