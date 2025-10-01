import { analyzeReadability } from '../utils/textstat.js';
import { ReadabilityResult } from '../types.js';

const TARGET_AGE = 17;
const TARGET_GRADE_MIN = 11;
const TARGET_GRADE_MAX = 13;
const TARGET_READING_EASE_MIN = 60;
const TARGET_READING_EASE_MAX = 70;

/**
 * Checks text readability using textstat library via Python
 */
export async function checkReadability(
	text: string
): Promise<ReadabilityResult> {
	if (!text || text.trim().length === 0) {
		throw new Error('Text cannot be empty');
	}

	try {
		const stats = await analyzeReadability(text);

		const gradeLevel = stats.flesch_kincaid_grade;
		const readingEase = stats.flesch_reading_ease;

		const ageAppropriate =
			gradeLevel >= TARGET_GRADE_MIN &&
			gradeLevel <= TARGET_GRADE_MAX &&
			readingEase >= TARGET_READING_EASE_MIN;

		const recommendations: string[] = [];

		if (gradeLevel > TARGET_GRADE_MAX) {
			recommendations.push(
				'Text is too complex for 17-year-olds. Simplify sentence structure and use shorter words.'
			);
		}
		if (gradeLevel < TARGET_GRADE_MIN) {
			recommendations.push(
				'Text may be too simple. Consider using more sophisticated vocabulary.'
			);
		}
		if (readingEase < TARGET_READING_EASE_MIN) {
			recommendations.push(
				'Text is difficult to read. Break long sentences and use simpler words.'
			);
		}
		if (readingEase > TARGET_READING_EASE_MAX) {
			recommendations.push(
				'Text is very easy to read. May be appropriate for younger audiences.'
			);
		}
		if (stats.difficult_words > text.split(/\s+/).length * 0.1) {
			recommendations.push(
				`High number of difficult words (${stats.difficult_words}). Consider simplifying vocabulary.`
			);
		}

		const difficultWords = extractDifficultWords(text);

		return {
			gradeLevel: Math.round(gradeLevel * 10) / 10,
			readingEase: Math.round(readingEase * 10) / 10,
			ageAppropriate,
			difficultWords: difficultWords.slice(0, 20),
			readingTimeMinutes: Math.ceil(stats.reading_time / 60),
			metrics: {
				fleschKincaidGrade:
					Math.round(stats.flesch_kincaid_grade * 10) / 10,
				fleschReadingEase:
					Math.round(stats.flesch_reading_ease * 10) / 10,
				smogIndex: Math.round(stats.smog_index * 10) / 10,
				colemanLiauIndex:
					Math.round(stats.coleman_liau_index * 10) / 10,
				automatedReadabilityIndex:
					Math.round(stats.automated_readability_index * 10) / 10,
				daleChallReadabilityScore:
					Math.round(stats.dale_chall_readability_score * 10) / 10,
				gunningFog: Math.round(stats.gunning_fog * 10) / 10,
			},
			recommendations:
				recommendations.length > 0
					? recommendations
					: ['Text is appropriate for 17-year-old readers.'],
		};
	} catch (error) {
		throw new Error(
			`Failed to analyze readability: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

/**
 * Extracts difficult words from text (3+ syllables, not common)
 */
function extractDifficultWords(text: string): string[] {
	const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
	const uniqueWords = [...new Set(words)];

	const commonWords = new Set([
		'the',
		'and',
		'for',
		'are',
		'but',
		'not',
		'you',
		'all',
		'can',
		'had',
		'her',
		'was',
		'one',
		'our',
		'out',
		'day',
		'get',
		'has',
		'him',
		'his',
		'how',
		'man',
		'new',
		'now',
		'old',
		'see',
		'two',
		'way',
		'who',
		'boy',
		'did',
		'its',
		'let',
		'put',
		'say',
		'she',
		'too',
		'use',
		'very',
		'important',
		'different',
		'however',
		'through',
		'another',
		'because',
		'beautiful',
	]);

	return uniqueWords
		.filter((word) => {
			if (word.length < 4) return false;
			if (commonWords.has(word)) return false;
			return countSyllables(word) >= 3;
		})
		.sort((a, b) => countSyllables(b) - countSyllables(a));
}

/**
 * Counts syllables in a word
 */
function countSyllables(word: string): number {
	word = word.toLowerCase();
	if (word.length <= 3) return 1;

	word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
	word = word.replace(/^y/, '');

	const matches = word.match(/[aeiouy]{1,2}/g);
	return matches ? matches.length : 1;
}
