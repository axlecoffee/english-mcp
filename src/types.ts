import { z } from 'zod';

// Zod schemas for tool inputs
export const WordSchema = z.object({
	word: z.string().describe('The word to look up'),
});

export const TextSchema = z.object({
	text: z.string().describe('The text to analyze'),
});

export const SearchPapersSchema = z.object({
	query: z.string().describe('Search query for academic papers'),
	year: z
		.string()
		.optional()
		.describe('Publication year or range (e.g., "2020" or "2018-2023")'),
	limit: z
		.number()
		.optional()
		.default(10)
		.describe('Maximum number of results'),
});

export const PaperIdSchema = z.object({
	paperId: z.string().describe('Semantic Scholar paper ID or DOI'),
});

export const WikipediaSearchSchema = z.object({
	query: z.string().describe('Search query for Wikipedia articles'),
	limit: z
		.number()
		.optional()
		.default(5)
		.describe('Maximum number of results'),
});

export const WikipediaTitleSchema = z.object({
	title: z.string().describe('Wikipedia article title'),
});

export const QuoteSearchSchema = z.object({
	query: z.string().optional().describe('Search query for quotes'),
	author: z.string().optional().describe('Author name to filter by'),
	tags: z
		.array(z.string())
		.optional()
		.describe('Tags to filter by (e.g., ["wisdom", "life"])'),
	limit: z
		.number()
		.optional()
		.default(10)
		.describe('Maximum number of results'),
});

export const QuoteTagsSchema = z.object({
	tags: z
		.array(z.string())
		.optional()
		.describe('Tags to filter random quote (e.g., ["inspirational"])'),
});

export const WordRelationshipSchema = z.object({
	word: z.string().describe('The word to find relationships for'),
	type: z
		.enum([
			'synonyms',
			'antonyms',
			'rhymes',
			'similar-meaning',
			'sounds-like',
		])
		.describe('Type of relationship'),
	limit: z
		.number()
		.optional()
		.default(10)
		.describe('Maximum number of results'),
});

export const CitationSchema = z.object({
	data: z
		.union([z.string(), z.any()])
		.describe('Citation data: DOI string or CSL-JSON object'),
	style: z
		.enum(['mla', 'apa', 'chicago', 'harvard', 'vancouver'])
		.describe('Citation style'),
	format: z
		.enum(['text', 'html', 'rtf'])
		.optional()
		.default('text')
		.describe('Output format'),
	lang: z.string().optional().default('en-US').describe('Language code'),
});

export const BibliographySchema = z.object({
	citations: z
		.array(z.union([z.string(), z.any()]))
		.describe('Array of DOIs or CSL-JSON objects'),
	style: z
		.enum(['mla', 'apa', 'chicago', 'harvard', 'vancouver'])
		.describe('Citation style'),
	format: z
		.enum(['text', 'html', 'rtf'])
		.optional()
		.default('text')
		.describe('Output format'),
	lang: z.string().optional().default('en-US').describe('Language code'),
	sort: z
		.boolean()
		.optional()
		.default(true)
		.describe('Sort bibliography alphabetically'),
});

export const DoiSchema = z.object({
	doi: z.string().describe('DOI to look up (e.g., "10.1000/xyz123")'),
	style: z
		.enum(['mla', 'apa', 'chicago', 'harvard', 'vancouver'])
		.optional()
		.default('mla')
		.describe('Citation style'),
	format: z
		.enum(['text', 'html', 'rtf'])
		.optional()
		.default('text')
		.describe('Output format'),
});

// Type exports
export type WordInput = z.infer<typeof WordSchema>;
export type TextInput = z.infer<typeof TextSchema>;

// API Response types
export interface MerriamWebsterThesaurusEntry {
	meta?: {
		id?: string;
		syns?: string[][];
		ants?: string[][];
	};
	hwi?: {
		hw?: string;
	};
	fl?: string;
	shortdef?: string[];
}

export interface MerriamWebsterDictionaryEntry {
	hwi?: {
		hw?: string;
	};
	fl?: string;
	shortdef?: string[];
}

export interface SaplingGrammarEdit {
	sentence: string;
	start: number;
	end: number;
	replacement: string;
	general_error_type: string;
	error_type: string;
}

export interface SaplingGrammarResponse {
	edits?: SaplingGrammarEdit[];
}

export interface SaplingToneResponse {
	overall?: string;
	tones?: Record<string, number>;
}

export interface SaplingSentimentResponse {
	sentiment?: string;
	score?: number;
}

export interface SaplingAIDetectionSentence {
	score: number;
	sentence: string;
}

export interface SaplingAIDetectionResponse {
	score: number;
	sentence_scores?: SaplingAIDetectionSentence[];
}

// Structured response types for AI consumption
export interface StructuredToolResponse {
	success: boolean;
	tool: string;
	data?: any;
	error?: string;
	metadata?: Record<string, any>;
}

export interface GrammarCheckResult {
	errorCount: number;
	suggestions: Array<{
		original: string;
		replacement: string;
		type: string;
		category: string;
		position: { start: number; end: number };
	}>;
}

export interface ToneAnalysisResult {
	overall: string;
	scores: Record<string, number>;
	dominant: string[];
}

export interface SentimentAnalysisResult {
	sentiment: 'positive' | 'negative' | 'neutral';
	score: number;
	confidence: 'high' | 'medium' | 'low';
}

export interface AIDetectionResult {
	overallScore: number;
	likelihood: 'high' | 'moderate' | 'low';
	flaggedSentences: Array<{
		text: string;
		score: number;
		index: number;
	}>;
	suspiciousSentences: Array<{
		text: string;
		score: number;
		index: number;
	}>;
	recommendations?: string[];
}

export interface ThesaurusEntry {
	id: string;
	partOfSpeech?: string;
	definitions: string[];
	synonyms: string[];
	antonyms: string[];
}

export interface ThesaurusResult {
	word: string;
	entries: ThesaurusEntry[];
}

export interface DictionaryResult {
	word: string;
	partOfSpeech?: string;
	definitions: string[];
}

export interface ReadabilityResult {
	gradeLevel: number;
	readingEase: number;
	ageAppropriate: boolean;
	difficultWords: string[];
	readingTimeMinutes: number;
	metrics: {
		fleschKincaidGrade: number;
		fleschReadingEase: number;
		smogIndex: number;
		colemanLiauIndex: number;
		automatedReadabilityIndex: number;
		daleChallReadabilityScore: number;
		gunningFog: number;
	};
	recommendations: string[];
}

export interface PassiveVoiceResult {
	passiveCount: number;
	totalSentences: number;
	passivePercentage: number;
	flaggedSentences: Array<{
		sentence: string;
		position: number;
		suggestion: string;
	}>;
}

export interface AcademicVocabularyResult {
	word: string;
	suggestions: Array<{
		word: string;
		definition: string;
		academicScore: number;
		example?: string;
	}>;
}
