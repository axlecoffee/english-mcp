import { MerriamWebsterAPI } from '../api/merriam-webster.js';
import { ResponseFormatter } from '../responses/formatters.js';
import type { ToolResult } from '../responses/formatters.js';
import { AcademicVocabularyResult } from '../types.js';

const api = new MerriamWebsterAPI();

export async function getSynonymsAntonyms(word: string): Promise<ToolResult> {
	try {
		const result = await api.getThesaurus(word);
		return ResponseFormatter.formatThesaurus(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'get_synonyms_antonyms',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

export async function lookupDictionary(word: string): Promise<ToolResult> {
	try {
		const result = await api.getDictionary(word);
		return ResponseFormatter.formatDictionary(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'lookup_dictionary',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

export async function suggestAcademicVocabulary(
	word: string
): Promise<AcademicVocabularyResult> {
	if (!word || word.trim().length === 0) {
		throw new Error('Word cannot be empty');
	}

	try {
		const thesaurusResult = await api.getThesaurus(word.toLowerCase());

		if (
			!thesaurusResult ||
			!thesaurusResult.entries ||
			thesaurusResult.entries.length === 0
		) {
			return {
				word,
				suggestions: [],
			};
		}

		const allSynonyms = new Set<string>();
		thesaurusResult.entries.forEach((entry) => {
			if (entry.synonyms) {
				entry.synonyms.forEach((syn) => allSynonyms.add(syn));
			}
		});

		const rankedSuggestions = Array.from(allSynonyms)
			.map((synonym) => ({
				word: synonym,
				academicScore: calculateAcademicScore(synonym),
				definition: '',
			}))
			.filter((s) => s.academicScore > 0 && s.word !== word.toLowerCase())
			.sort((a, b) => b.academicScore - a.academicScore)
			.slice(0, 10);

		for (const suggestion of rankedSuggestions) {
			try {
				const dictResult = await api.getDictionary(suggestion.word);
				if (
					dictResult &&
					dictResult.definitions &&
					dictResult.definitions.length > 0
				) {
					suggestion.definition = dictResult.definitions[0] || '';
				}
			} catch {
				suggestion.definition = 'No definition available';
			}
		}

		return {
			word,
			suggestions: rankedSuggestions,
		};
	} catch (error) {
		throw new Error(
			`Academic vocabulary suggestion failed: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

/**
 * Calculates academic formality score for a word
 */
function calculateAcademicScore(word: string): number {
	let score = 0;

	if (word.length >= 10) score += 3;
	else if (word.length >= 8) score += 2;
	else if (word.length >= 6) score += 1;
	else return 0;

	const latinGreekPrefixes = [
		'pre',
		'post',
		'anti',
		'pro',
		'contra',
		'inter',
		'intra',
		'trans',
		'sub',
		'super',
		'hyper',
		'hypo',
		'meta',
		'para',
		'peri',
		'syn',
		'sym',
		'auto',
		'bio',
		'geo',
		'tele',
		'micro',
		'macro',
		'mono',
		'poly',
		'multi',
		'omni',
		'pseudo',
		'neo',
		'proto',
	];

	const latinGreekSuffixes = [
		'tion',
		'sion',
		'ment',
		'ence',
		'ance',
		'ity',
		'ous',
		'ious',
		'eous',
		'able',
		'ible',
		'ive',
		'ate',
		'ize',
		'ise',
		'ify',
		'graphy',
		'logy',
		'nomy',
		'metry',
		'cracy',
		'archy',
		'ology',
		'phobia',
		'philia',
	];

	if (latinGreekPrefixes.some((prefix) => word.startsWith(prefix))) {
		score += 2;
	}

	if (latinGreekSuffixes.some((suffix) => word.endsWith(suffix))) {
		score += 2;
	}

	const casualWords = [
		'big',
		'small',
		'good',
		'bad',
		'nice',
		'cool',
		'great',
		'awesome',
		'stuff',
		'things',
		'get',
		'got',
		'lots',
		'very',
		'really',
		'pretty',
		'kind',
		'sort',
		'okay',
		'fine',
		'just',
		'maybe',
	];

	if (casualWords.includes(word.toLowerCase())) {
		score = 0;
	}

	const academicWords = [
		'demonstrate',
		'illustrate',
		'elucidate',
		'substantiate',
		'corroborate',
		'facilitate',
		'implement',
		'utilize',
		'constitute',
		'exemplify',
		'phenomenon',
		'paradigm',
		'hypothesis',
		'methodology',
		'synthesis',
		'analyze',
		'evaluate',
		'interpret',
		'examine',
		'investigate',
	];

	if (academicWords.includes(word.toLowerCase())) {
		score += 3;
	}

	return score;
}
