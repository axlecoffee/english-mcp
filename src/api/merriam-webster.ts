import { fetchJson } from '../utils/http.js';
import { config } from '../config.js';
import type {
	MerriamWebsterThesaurusEntry,
	MerriamWebsterDictionaryEntry,
	ThesaurusResult,
	DictionaryResult,
} from '../types.js';

export class MerriamWebsterAPI {
	async getThesaurus(word: string): Promise<ThesaurusResult> {
		if (!config.merriamWebster.thesaurusKey) {
			throw new Error('MERRIAM_WEBSTER_THESAURUS_KEY not configured');
		}

		const url = `https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${encodeURIComponent(
			word
		)}?key=${config.merriamWebster.thesaurusKey}`;

		const data = await fetchJson(url);

		if (Array.isArray(data) && data.length === 0) {
			throw new Error(`No results found for "${word}"`);
		}

		if (typeof data[0] === 'string') {
			throw new Error(`Did you mean: ${data.join(', ')}`);
		}

		// Process ALL entries, not just the first one
		const entries = (data as MerriamWebsterThesaurusEntry[]).map(
			(entry, index) => {
				// Extract all synonyms from all sense groups in metadata
				const allSynonyms: string[] = [];
				if (entry.meta?.syns) {
					for (const synGroup of entry.meta.syns) {
						allSynonyms.push(...synGroup);
					}
				}

				// Extract all antonyms from all sense groups in metadata
				const allAntonyms: string[] = [];
				if (entry.meta?.ants) {
					for (const antGroup of entry.meta.ants) {
						allAntonyms.push(...antGroup);
					}
				}

				return {
					id: entry.meta?.id || `entry-${index}`,
					partOfSpeech: entry.fl,
					definitions: entry.shortdef || [],
					synonyms: allSynonyms,
					antonyms: allAntonyms,
				};
			}
		);

		return {
			word,
			entries,
		};
	}

	async getDictionary(word: string): Promise<DictionaryResult> {
		if (!config.merriamWebster.dictionaryKey) {
			throw new Error('MERRIAM_WEBSTER_DICTIONARY_KEY not configured');
		}

		const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(
			word
		)}?key=${config.merriamWebster.dictionaryKey}`;

		const data = await fetchJson(url);

		if (Array.isArray(data) && data.length === 0) {
			throw new Error(`No results found for "${word}"`);
		}

		if (typeof data[0] === 'string') {
			throw new Error(`Did you mean: ${data.join(', ')}`);
		}

		const entry = data[0] as MerriamWebsterDictionaryEntry;

		return {
			word: entry.hwi?.hw || word,
			partOfSpeech: entry.fl,
			definitions: entry.shortdef || [],
		};
	}
}
