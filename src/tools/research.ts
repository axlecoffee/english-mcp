import { SemanticScholarClient } from '../api/semantic-scholar.js';
import { WikipediaClient } from '../api/wikipedia.js';
import { QuotableClient } from '../api/quotable.js';
import { DatamuseClient } from '../api/datamuse.js';
import { WordnikClient } from '../api/wordnik.js';
import { LanguageToolClient } from '../api/languagetool.js';

const semanticScholar = new SemanticScholarClient();
const wikipedia = new WikipediaClient();
const quotable = new QuotableClient();
const datamuse = new DatamuseClient();
const languageTool = new LanguageToolClient();

let wordnik: WordnikClient | null = null;

/**
 * Initialize Wordnik client with API key from environment
 */
export function initializeWordnik(apiKey: string) {
	wordnik = new WordnikClient({ apiKey });
}

/**
 * Search academic papers using Semantic Scholar
 */
export async function searchAcademicPapers(params: {
	query: string;
	year?: string;
	limit?: number;
}) {
	const { query, year, limit = 10 } = params;

	const results = await semanticScholar.searchPapers({
		query,
		year,
		limit,
		fields: [
			'title',
			'authors',
			'year',
			'abstract',
			'venue',
			'citationCount',
			'influentialCitationCount',
			'isOpenAccess',
			'openAccessPdf',
			'url',
			'externalIds',
		],
	});

	return {
		total: results.total,
		papers: results.data.map((paper) => ({
			title: paper.title,
			authors: paper.authors?.map((a) => a.name).join(', ') || 'Unknown',
			year: paper.year,
			abstract: paper.abstract,
			venue: paper.venue,
			citations: paper.citationCount,
			influentialCitations: paper.influentialCitationCount,
			openAccess: paper.isOpenAccess,
			pdfUrl: paper.openAccessPdf?.url,
			doi: paper.externalIds?.DOI,
			url: paper.url,
		})),
	};
}

/**
 * Get paper metadata and citations
 */
export async function getPaperDetails(paperId: string) {
	const paper = await semanticScholar.getPaper(paperId, [
		'title',
		'authors',
		'year',
		'abstract',
		'venue',
		'citationCount',
		'referenceCount',
		'influentialCitationCount',
		'fieldsOfStudy',
		'externalIds',
	]);

	const citations = await semanticScholar.getPaperCitations(
		paperId,
		['title', 'authors', 'year'],
		10
	);
	const references = await semanticScholar.getPaperReferences(
		paperId,
		['title', 'authors', 'year'],
		10
	);

	return {
		paper: {
			title: paper.title,
			authors: paper.authors?.map((a) => a.name) || [],
			year: paper.year,
			abstract: paper.abstract,
			venue: paper.venue,
			citations: paper.citationCount,
			references: paper.referenceCount,
			influentialCitations: paper.influentialCitationCount,
			fields: paper.fieldsOfStudy,
			doi: paper.externalIds?.DOI,
		},
		citedBy: citations.data.map((c) => ({
			title: c.citingPaper.title,
			authors: c.citingPaper.authors?.map((a) => a.name).join(', '),
			year: c.citingPaper.year,
		})),
		references: references.data.map((r) => ({
			title: r.citedPaper.title,
			authors: r.citedPaper.authors?.map((a) => a.name).join(', '),
			year: r.citedPaper.year,
		})),
	};
}

/**
 * Search Wikipedia articles
 */
export async function searchWikipedia(query: string, limit: number = 5) {
	const results = await wikipedia.searchWithSummaries(query, limit);

	return {
		articles: results.map((article) => ({
			title: article.title,
			summary:
				article.extract?.substring(0, 300) +
				(article.extract && article.extract.length > 300 ? '...' : ''),
			url: article.fullurl,
			thumbnail: article.thumbnail?.source,
		})),
	};
}

/**
 * Get Wikipedia article summary
 */
export async function getWikipediaSummary(title: string) {
	const article = await wikipedia.getSummary(title);

	return {
		title: article.title,
		summary: article.extract,
		url: article.fullurl,
	};
}

/**
 * Search for quotes
 */
export async function searchQuotes(params: {
	query?: string;
	author?: string;
	tags?: string[];
	limit?: number;
}) {
	const { query, author, tags, limit = 10 } = params;

	if (!query && !author && !tags) {
		const randomQuote = await quotable.getRandomQuote();
		return {
			quotes: [
				{
					content: randomQuote.content,
					author: randomQuote.author,
					tags: randomQuote.tags,
				},
			],
		};
	}

	const results = await quotable.searchQuotes({
		query,
		author,
		tags,
		limit,
	});

	return {
		total: results.totalCount,
		quotes: results.results.map((quote) => ({
			content: quote.content,
			author: quote.author,
			tags: quote.tags,
		})),
	};
}

/**
 * Get random inspirational quote
 */
export async function getRandomQuote(params?: { tags?: string[] }) {
	const quote = await quotable.getRandomQuote(params);

	return {
		content: quote.content,
		author: quote.author,
		tags: quote.tags,
		length: quote.length,
	};
}

/**
 * Find word relationships using Datamuse
 */
export async function findWordRelationships(params: {
	word: string;
	type:
		| 'synonyms'
		| 'antonyms'
		| 'rhymes'
		| 'similar-meaning'
		| 'sounds-like';
	limit?: number;
}) {
	const { word, type, limit = 10 } = params;

	let results;
	switch (type) {
		case 'synonyms':
			results = await datamuse.findSynonyms(word, limit);
			break;
		case 'antonyms':
			results = await datamuse.findAntonyms(word, limit);
			break;
		case 'rhymes':
			results = await datamuse.findRhymes(word, limit);
			break;
		case 'similar-meaning':
			results = await datamuse.findSimilarMeaning(word, limit);
			break;
		case 'sounds-like':
			results = await datamuse.findSoundsLike(word, limit);
			break;
		default:
			throw new Error(`Unknown relationship type: ${type}`);
	}

	return {
		word,
		type,
		results: results.map((r) => ({
			word: r.word,
			score: r.score,
			definitions: r.defs,
		})),
	};
}

/**
 * Advanced grammar and style check using LanguageTool
 */
export async function checkGrammarAdvanced(text: string) {
	const result = await languageTool.checkWithCategories(text);

	return {
		totalErrors: result.totalErrors,
		summary: {
			grammar: result.grammar.length,
			spelling: result.spelling.length,
			style: result.style.length,
			other: result.other.length,
		},
		issues: {
			grammar: result.grammar.map((m) => ({
				message: m.message,
				context: m.context.text,
				offset: m.offset,
				length: m.length,
				suggestions: m.replacements.map((r) => r.value),
				rule: m.rule.description,
			})),
			spelling: result.spelling.map((m) => ({
				message: m.message,
				context: m.context.text,
				offset: m.offset,
				length: m.length,
				suggestions: m.replacements.map((r) => r.value),
			})),
			style: result.style.map((m) => ({
				message: m.message,
				context: m.context.text,
				offset: m.offset,
				length: m.length,
				suggestions: m.replacements.map((r) => r.value),
			})),
		},
	};
}

/**
 * Get comprehensive word information from Wordnik
 */
export async function getWordDetails(word: string) {
	if (!wordnik) {
		throw new Error(
			'Wordnik API key not configured. Set WORDNIK_API_KEY environment variable.'
		);
	}

	const [definitions, examples, relatedWords, pronunciations] =
		await Promise.all([
			wordnik.getDefinitions(word, { limit: 5 }),
			wordnik.getExamples(word, 3).catch(() => ({ examples: [] })),
			wordnik
				.getRelatedWords(word, ['synonym', 'antonym', 'variant'])
				.catch(() => []),
			wordnik.getPronunciations(word).catch(() => []),
		]);

	return {
		word,
		definitions: definitions.map((d) => ({
			text: d.text,
			partOfSpeech: d.partOfSpeech,
			source: d.sourceDictionary,
		})),
		examples: examples.examples.map((e) => e.text),
		relatedWords: relatedWords.map((r) => ({
			type: r.relationshipType,
			words: r.words,
		})),
		pronunciations: pronunciations.map((p) => p.raw),
	};
}

/**
 * Get word of the day from Wordnik
 */
export async function getWordOfTheDay() {
	if (!wordnik) {
		throw new Error('Wordnik API key not configured');
	}

	const wotd = await wordnik.getWordOfTheDay();

	return {
		word: wotd.word,
		definitions: wotd.definitions.map((d) => ({
			text: d.text,
			partOfSpeech: d.partOfSpeech,
		})),
		examples: wotd.examples?.map((e) => e.text) || [],
		note: wotd.note,
	};
}
