#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import {
	WordSchema,
	TextSchema,
	SearchPapersSchema,
	PaperIdSchema,
	WikipediaSearchSchema,
	WikipediaTitleSchema,
	QuoteSearchSchema,
	QuoteTagsSchema,
	WordRelationshipSchema,
	CitationSchema,
	BibliographySchema,
	DoiSchema,
} from './types.js';
import {
	getSynonymsAntonyms,
	lookupDictionary,
	suggestAcademicVocabulary,
} from './tools/dictionary.js';
import { checkGrammar } from './tools/grammar.js';
import { analyzeTone } from './tools/tone.js';
import { analyzeSentiment } from './tools/sentiment.js';
import { detectAIContent } from './tools/ai-detection.js';
import { checkReadability } from './tools/readability.js';
import {
	searchAcademicPapers,
	getPaperDetails,
	searchWikipedia,
	getWikipediaSummary,
	searchQuotes,
	getRandomQuote,
	findWordRelationships,
	checkGrammarAdvanced,
	getWordDetails,
	getWordOfTheDay,
	initializeWordnik,
} from './tools/research.js';
import {
	formatCitation,
	generateBibliography,
	searchAndFormatDoi,
	convertToBibtex,
} from './tools/citations.js';

// Initialize Wordnik if API key is available
const wordnikApiKey = process.env.WORDNIK_API_KEY;
if (wordnikApiKey) {
	initializeWordnik(wordnikApiKey);
}

// Server setup
const server = new Server(
	{
		name: 'english-mcp',
		version: '3.0.0',
	},
	{
		capabilities: {
			tools: {},
			resources: {},
		},
	}
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'get_synonyms_antonyms',
				description:
					'Find synonyms and antonyms for a word using Merriam-Webster Thesaurus. Returns both human-readable text and structured JSON for AI parsing.',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'lookup_dictionary',
				description:
					'Look up word definitions, parts of speech, and usage examples using Merriam-Webster Collegiate Dictionary. Returns both human-readable text and structured JSON for AI parsing.',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'suggest_academic_vocabulary',
				description:
					'Find formal academic alternatives to a word. Returns synonyms ranked by academic formality with definitions. Perfect for elevating casual language to academic writing standards.',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'check_grammar',
				description:
					'Check text for grammar and spelling errors with AI-powered suggestions. Returns detailed error categorization and structured JSON for AI parsing.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'check_readability',
				description:
					'Analyze text readability with 7+ metrics including Flesch-Kincaid Grade Level and Reading Ease. Verifies if text is appropriate for 17-year-olds. Returns grade level, difficult words, reading time, and recommendations.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'analyze_tone',
				description:
					'Analyze the tone and style of text (formal, casual, confident, etc.). Returns tone scores and dominant tones in both human and machine-readable formats.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'analyze_sentiment',
				description:
					'Detect the emotional sentiment of text (positive, negative, neutral) with confidence scoring. Returns structured sentiment analysis for AI interpretation.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'detect_ai_content',
				description:
					'Check if content appears to be AI-generated with sentence-level analysis. Returns flagged sentences, confidence scores, and actionable recommendations in both human and machine-readable formats.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'search_academic_papers',
				description:
					'Search 214M+ academic papers from Semantic Scholar by keywords, year, or topic. Returns paper titles, authors, abstracts, citations, and open access PDFs. Essential for research and literature reviews.',
				inputSchema: zodToJsonSchema(SearchPapersSchema),
			},
			{
				name: 'get_paper_details',
				description:
					'Get comprehensive details for a specific academic paper including full metadata, citation graph (papers that cite it and papers it references), and field classifications. Use paper ID or DOI.',
				inputSchema: zodToJsonSchema(PaperIdSchema),
			},
			{
				name: 'search_wikipedia',
				description:
					'Search Wikipedia articles and get summaries. Returns article titles, excerpts, URLs, and thumbnails. Perfect for quick research and fact-checking.',
				inputSchema: zodToJsonSchema(WikipediaSearchSchema),
			},
			{
				name: 'get_wikipedia_summary',
				description:
					'Get the full summary of a specific Wikipedia article by exact title. Returns complete introduction and article URL.',
				inputSchema: zodToJsonSchema(WikipediaTitleSchema),
			},
			{
				name: 'search_quotes',
				description:
					'Search for quotes by content, author, or tags. Returns relevant quotes with attribution. Great for finding supporting quotes or inspiration.',
				inputSchema: zodToJsonSchema(QuoteSearchSchema),
			},
			{
				name: 'get_random_quote',
				description:
					'Get a random inspirational quote, optionally filtered by tags (e.g., wisdom, life, success). Perfect for writing inspiration or motivation.',
				inputSchema: zodToJsonSchema(QuoteTagsSchema),
			},
			{
				name: 'find_word_relationships',
				description:
					'Find word relationships using Datamuse: synonyms, antonyms, rhymes, similar meaning, or sounds-like. Returns ranked results with definitions. More comprehensive than basic thesaurus.',
				inputSchema: zodToJsonSchema(WordRelationshipSchema),
			},
			{
				name: 'check_grammar_advanced',
				description:
					'Advanced grammar and style checking using LanguageTool. Categorizes issues into grammar, spelling, and style. More detailed than basic grammar check.',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'get_word_details',
				description:
					'Get comprehensive word information from Wordnik including definitions, examples, related words, and pronunciations. Requires WORDNIK_API_KEY environment variable.',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'get_word_of_the_day',
				description:
					"Get Wordnik's word of the day with definitions and examples. Great for vocabulary building.",
				inputSchema: zodToJsonSchema(z.object({})),
			},
			{
				name: 'format_citation',
				description:
					'Format a citation in MLA9, APA, Chicago, Harvard, or Vancouver style. Accepts DOI or CSL-JSON. Returns properly formatted citation for academic writing.',
				inputSchema: zodToJsonSchema(CitationSchema),
			},
			{
				name: 'generate_bibliography',
				description:
					'Generate a complete bibliography from multiple citations in any major style. Accepts array of DOIs or CSL-JSON objects. Automatically sorts entries.',
				inputSchema: zodToJsonSchema(BibliographySchema),
			},
			{
				name: 'search_doi_and_format',
				description:
					'Look up a DOI in CrossRef and return a formatted citation. Automatically retrieves metadata and formats in your chosen style.',
				inputSchema: zodToJsonSchema(DoiSchema),
			},
			{
				name: 'convert_to_bibtex',
				description:
					'Convert citation data to BibTeX format for LaTeX documents. Accepts DOI or CSL-JSON.',
				inputSchema: zodToJsonSchema(
					z.object({
						data: z
							.union([z.string(), z.any()])
							.describe('Citation data: DOI or CSL-JSON'),
					})
				),
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	try {
		switch (name) {
			case 'get_synonyms_antonyms': {
				const { word } = WordSchema.parse(args);
				return await getSynonymsAntonyms(word);
			}

			case 'lookup_dictionary': {
				const { word } = WordSchema.parse(args);
				return await lookupDictionary(word);
			}

			case 'suggest_academic_vocabulary': {
				const { word } = WordSchema.parse(args);
				const result = await suggestAcademicVocabulary(word);
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}

			case 'check_grammar': {
				const { text } = TextSchema.parse(args);
				return await checkGrammar(text);
			}

			case 'check_readability': {
				const { text } = TextSchema.parse(args);
				const result = await checkReadability(text);
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}

			case 'analyze_tone': {
				const { text } = TextSchema.parse(args);
				return await analyzeTone(text);
			}

			case 'analyze_sentiment': {
				const { text } = TextSchema.parse(args);
				return await analyzeSentiment(text);
			}

			case 'detect_ai_content': {
				const { text } = TextSchema.parse(args);
				return await detectAIContent(text);
			}

			case 'search_academic_papers': {
				const params = SearchPapersSchema.parse(args);
				const result = await searchAcademicPapers(params);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'get_paper_details': {
				const { paperId } = PaperIdSchema.parse(args);
				const result = await getPaperDetails(paperId);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'search_wikipedia': {
				const params = WikipediaSearchSchema.parse(args);
				const result = await searchWikipedia(
					params.query,
					params.limit
				);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'get_wikipedia_summary': {
				const { title } = WikipediaTitleSchema.parse(args);
				const result = await getWikipediaSummary(title);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'search_quotes': {
				const params = QuoteSearchSchema.parse(args);
				const result = await searchQuotes(params);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'get_random_quote': {
				const params = QuoteTagsSchema.parse(args);
				const result = await getRandomQuote(params);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'find_word_relationships': {
				const params = WordRelationshipSchema.parse(args);
				const result = await findWordRelationships(params);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'check_grammar_advanced': {
				const { text } = TextSchema.parse(args);
				const result = await checkGrammarAdvanced(text);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'get_word_details': {
				const { word } = WordSchema.parse(args);
				const result = await getWordDetails(word);
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'get_word_of_the_day': {
				const result = await getWordOfTheDay();
				return {
					content: [
						{ type: 'text', text: JSON.stringify(result, null, 2) },
					],
				};
			}

			case 'format_citation': {
				const params = CitationSchema.parse(args);
				if (!params.data) {
					throw new Error('Citation data is required');
				}
				const result = await formatCitation({
					data: params.data,
					style: params.style,
					format: params.format || 'text',
					lang: params.lang,
				});
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'generate_bibliography': {
				const params = BibliographySchema.parse(args);
				const result = await generateBibliography(params);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'search_doi_and_format': {
				const params = DoiSchema.parse(args);
				const result = await searchAndFormatDoi({
					doi: params.doi,
					style: params.style || 'mla',
					format: params.format || 'text',
				});
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}

			case 'convert_to_bibtex': {
				const { data } = z
					.object({
						data: z.union([z.string(), z.any()]),
					})
					.parse(args);
				const result = await convertToBibtex(data);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			default:
				return {
					content: [{ type: 'text', text: `Unknown tool: ${name}` }],
					isError: true,
				};
		}
	} catch (error) {
		return {
			content: [
				{
					type: 'text',
					text: `Error: ${
						error instanceof Error ? error.message : String(error)
					}`,
				},
			],
			isError: true,
		};
	}
});

// Start server
async function runServer() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('English MCP Server v3.0.0 running on stdio');
	console.error(
		'Comprehensive language tools: dictionary, grammar, citations, readability, research APIs'
	);
}

runServer().catch((error) => {
	console.error('Fatal error running server:', error);
	process.exit(1);
});
