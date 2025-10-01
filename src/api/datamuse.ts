import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.datamuse.com';

export interface DatamuseWord {
	word: string;
	score: number;
	numSyllables?: number;
	tags?: string[];
	defs?: string[];
}

/**
 * Client for Datamuse API.
 * Free tier: 100,000 requests/day
 */
export class DatamuseClient {
	/**
	 * Find words with similar meaning
	 */
	async findSimilarMeaning(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			ml: word,
			max: max.toString(),
			md: 'd',
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find words that sound like the input
	 */
	async findSoundsLike(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			sl: word,
			max: max.toString(),
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find words that rhyme
	 */
	async findRhymes(word: string, max: number = 10): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			rel_rhy: word,
			max: max.toString(),
			md: 's',
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find synonyms
	 */
	async findSynonyms(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			rel_syn: word,
			max: max.toString(),
			md: 'd',
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find antonyms
	 */
	async findAntonyms(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			rel_ant: word,
			max: max.toString(),
			md: 'd',
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find words that frequently follow
	 */
	async findFollowers(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			rel_bga: word,
			max: max.toString(),
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Find words that frequently precede
	 */
	async findPreceding(
		word: string,
		max: number = 10
	): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			rel_bgb: word,
			max: max.toString(),
		});

		return fetchJson(`${BASE_URL}/words?${params.toString()}`);
	}

	/**
	 * Autocomplete suggestions
	 */
	async suggest(prefix: string, max: number = 10): Promise<DatamuseWord[]> {
		const params = new URLSearchParams({
			s: prefix,
			max: max.toString(),
		});

		return fetchJson(`${BASE_URL}/sug?${params.toString()}`);
	}

	/**
	 * Advanced word search with multiple constraints
	 */
	async search(params: {
		meansLike?: string;
		soundsLike?: string;
		spelledLike?: string;
		rhymesWith?: string;
		topics?: string[];
		leftContext?: string;
		rightContext?: string;
		max?: number;
	}): Promise<DatamuseWord[]> {
		const queryParams = new URLSearchParams();

		if (params.meansLike) queryParams.set('ml', params.meansLike);
		if (params.soundsLike) queryParams.set('sl', params.soundsLike);
		if (params.spelledLike) queryParams.set('sp', params.spelledLike);
		if (params.rhymesWith) queryParams.set('rel_rhy', params.rhymesWith);
		if (params.topics) queryParams.set('topics', params.topics.join(','));
		if (params.leftContext) queryParams.set('lc', params.leftContext);
		if (params.rightContext) queryParams.set('rc', params.rightContext);
		if (params.max) queryParams.set('max', params.max.toString());

		queryParams.set('md', 'dps');

		return fetchJson(`${BASE_URL}/words?${queryParams.toString()}`);
	}
}
