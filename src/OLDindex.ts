#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// API Configuration from environment variables
const MERRIAM_WEBSTER_THESAURUS_KEY =
	process.env.MERRIAM_WEBSTER_THESAURUS_KEY || '';
const MERRIAM_WEBSTER_DICTIONARY_KEY =
	process.env.MERRIAM_WEBSTER_DICTIONARY_KEY || '';
const SAPLING_PRIVATE_KEY = process.env.SAPLING_PRIVATE_KEY || '';
const SAPLING_PUBLIC_KEY = process.env.SAPLING_PUBLIC_KEY || '';

// Zod schemas for tool inputs
const WordSchema = z.object({
	word: z.string().describe('The word to look up'),
});

const TextSchema = z.object({
	text: z.string().describe('The text to analyze'),
});

// Helper function to make HTTP requests
async function fetchJson(url: string, options?: RequestInit): Promise<any> {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	return response.json();
}

// Merriam-Webster API functions
async function getSynonymsAntonyms(word: string): Promise<string> {
	if (!MERRIAM_WEBSTER_THESAURUS_KEY) {
		return 'Error: MERRIAM_WEBSTER_THESAURUS_KEY not configured';
	}

	try {
		const url = `https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${encodeURIComponent(
			word
		)}?key=${MERRIAM_WEBSTER_THESAURUS_KEY}`;
		const data = await fetchJson(url);

		if (Array.isArray(data) && data.length === 0) {
			return `No results found for "${word}"`;
		}

		if (typeof data[0] === 'string') {
			return `Did you mean: ${data.join(', ')}`;
		}

		const entry = data[0];
		const synonyms = entry.meta?.syns?.[0] || [];
		const antonyms = entry.meta?.ants?.[0] || [];

		let result = `**${word}**\n\n`;

		if (synonyms.length > 0) {
			result += `**Synonyms**: ${synonyms.join(', ')}\n\n`;
		} else {
			result += `No synonyms found.\n\n`;
		}

		if (antonyms.length > 0) {
			result += `**Antonyms**: ${antonyms.join(', ')}`;
		} else {
			result += `No antonyms found.`;
		}

		return result;
	} catch (error) {
		return `Error fetching synonyms/antonyms: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

async function lookupDictionary(word: string): Promise<string> {
	if (!MERRIAM_WEBSTER_DICTIONARY_KEY) {
		return 'Error: MERRIAM_WEBSTER_DICTIONARY_KEY not configured';
	}

	try {
		const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(
			word
		)}?key=${MERRIAM_WEBSTER_DICTIONARY_KEY}`;
		const data = await fetchJson(url);

		if (Array.isArray(data) && data.length === 0) {
			return `No results found for "${word}"`;
		}

		if (typeof data[0] === 'string') {
			return `Did you mean: ${data.join(', ')}`;
		}

		const entry = data[0];
		let result = `**${entry.hwi?.hw || word}**\n\n`;

		if (entry.fl) {
			result += `*${entry.fl}*\n\n`;
		}

		if (entry.shortdef && entry.shortdef.length > 0) {
			result += `**Definitions**:\n`;
			entry.shortdef.forEach((def: string, idx: number) => {
				result += `${idx + 1}. ${def}\n`;
			});
		}

		return result;
	} catch (error) {
		return `Error fetching dictionary entry: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

// Sapling AI API functions
async function checkGrammar(text: string): Promise<string> {
	if (!SAPLING_PRIVATE_KEY) {
		return 'Error: SAPLING_PRIVATE_KEY not configured';
	}

	try {
		const url = 'https://api.sapling.ai/api/v1/edits';
		const data = await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: SAPLING_PRIVATE_KEY,
				text: text,
				session_id: `english-mcp-${Date.now()}`,
			}),
		});

		if (!data.edits || data.edits.length === 0) {
			return 'No grammar or spelling errors found.';
		}

		let result = `Found ${data.edits.length} suggestion(s):\n\n`;
		data.edits.forEach((edit: any, idx: number) => {
			result += `${idx + 1}. **${edit.sentence.slice(
				edit.start,
				edit.end
			)}** → **${edit.replacement}**\n`;
			result += `   *${edit.general_error_type}*: ${edit.error_type}\n\n`;
		});

		return result;
	} catch (error) {
		return `Error checking grammar: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

async function analyzeTone(text: string): Promise<string> {
	if (!SAPLING_PRIVATE_KEY) {
		return 'Error: SAPLING_PRIVATE_KEY not configured';
	}

	try {
		const url = 'https://api.sapling.ai/api/v1/tone';
		const data = await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: SAPLING_PRIVATE_KEY,
				text: text,
			}),
		});

		if (!data.overall) {
			return 'Unable to determine tone.';
		}

		let result = `**Overall Tone**: ${data.overall}\n\n`;

		if (data.tones && Object.keys(data.tones).length > 0) {
			result += `**Tone Breakdown**:\n`;
			Object.entries(data.tones).forEach(([tone, score]) => {
				result += `- ${tone}: ${((score as number) * 100).toFixed(
					1
				)}%\n`;
			});
		}

		return result;
	} catch (error) {
		return `Error analyzing tone: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

async function analyzeSentiment(text: string): Promise<string> {
	if (!SAPLING_PRIVATE_KEY) {
		return 'Error: SAPLING_PRIVATE_KEY not configured';
	}

	try {
		const url = 'https://api.sapling.ai/api/v1/sentiment';
		const data = await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: SAPLING_PRIVATE_KEY,
				text: text,
			}),
		});

		const sentiment = data.sentiment || 'neutral';
		const score = data.score || 0;

		let result = `**Sentiment**: ${sentiment}\n`;
		result += `**Score**: ${(score * 100).toFixed(1)}%\n`;

		if (score > 0.6) {
			result += `\nThe text has a clearly positive sentiment.`;
		} else if (score < -0.6) {
			result += `\nThe text has a clearly negative sentiment.`;
		} else {
			result += `\nThe text has a neutral or mixed sentiment.`;
		}

		return result;
	} catch (error) {
		return `Error analyzing sentiment: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

async function detectAIContent(text: string): Promise<string> {
	if (!SAPLING_PRIVATE_KEY) {
		return 'Error: SAPLING_PRIVATE_KEY not configured';
	}

	try {
		const url = 'https://api.sapling.ai/api/v1/aidetect';
		const data = await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: SAPLING_PRIVATE_KEY,
				text: text,
			}),
		});

		const score = data.score || 0;
		const sentenceScores = data.sentence_scores || [];

		let result = `**Overall AI Detection Score**: ${(score * 100).toFixed(
			1
		)}%\n\n`;

		if (score > 0.8) {
			result += `⚠️ **High likelihood** this content is AI-generated.\n`;
		} else if (score > 0.5) {
			result += `⚠️ **Moderate likelihood** this content may be AI-generated.\n`;
		} else if (score > 0.3) {
			result += `**Low-moderate likelihood** of AI generation.\n`;
		} else {
			result += `✓ **Low likelihood** of AI generation. Content appears human-written.\n`;
		}

		if (sentenceScores.length > 0) {
			const flaggedSentences = sentenceScores.filter(
				(s: any) => s.score > 0.5
			);
			const suspiciousSentences = sentenceScores.filter(
				(s: any) => s.score > 0.3 && s.score <= 0.5
			);

			if (flaggedSentences.length > 0) {
				result += `\n\n**${flaggedSentences.length} sentence(s) flagged as likely AI-generated** (score > 50%):\n`;
				flaggedSentences.forEach((item: any, idx: number) => {
					const preview =
						item.sentence.length > 80
							? item.sentence.substring(0, 77) + '...'
							: item.sentence;
					result += `\n${idx + 1}. [${(item.score * 100).toFixed(
						1
					)}%] "${preview}"`;
				});
			}

			if (suspiciousSentences.length > 0) {
				result += `\n\n**${suspiciousSentences.length} sentence(s) may need review** (score 30-50%):\n`;
				suspiciousSentences.forEach((item: any, idx: number) => {
					const preview =
						item.sentence.length > 80
							? item.sentence.substring(0, 77) + '...'
							: item.sentence;
					result += `\n${idx + 1}. [${(item.score * 100).toFixed(
						1
					)}%] "${preview}"`;
				});
			}

			if (
				flaggedSentences.length === 0 &&
				suspiciousSentences.length === 0
			) {
				result += `\n\n✓ All ${sentenceScores.length} sentences appear human-written.`;
			}
		}

		if (score > 0.5) {
			result += `\n\n**Recommendations**:\n`;
			result += `- Rewrite flagged sentences with more personality and variation\n`;
			result += `- Add personal anecdotes or specific examples\n`;
			result += `- Vary sentence structure and vocabulary\n`;
			result += `- Use contractions and informal language where appropriate`;
		}

		return result;
	} catch (error) {
		return `Error detecting AI content: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
}

// Server setup
const server = new Server(
	{
		name: 'english-mcp',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
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
					'Find synonyms and antonyms for a word using Merriam-Webster Thesaurus',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'lookup_dictionary',
				description:
					'Look up word definitions, parts of speech, and usage examples using Merriam-Webster Collegiate Dictionary',
				inputSchema: zodToJsonSchema(WordSchema),
			},
			{
				name: 'check_grammar',
				description:
					'Check text for grammar and spelling errors with AI-powered suggestions',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'analyze_tone',
				description:
					'Analyze the tone and style of text (formal, casual, confident, etc.)',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'analyze_sentiment',
				description:
					'Detect the emotional sentiment of text (positive, negative, neutral)',
				inputSchema: zodToJsonSchema(TextSchema),
			},
			{
				name: 'detect_ai_content',
				description:
					'Check if content appears to be AI-generated with confidence scoring',
				inputSchema: zodToJsonSchema(TextSchema),
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
				const result = await getSynonymsAntonyms(word);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'lookup_dictionary': {
				const { word } = WordSchema.parse(args);
				const result = await lookupDictionary(word);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'check_grammar': {
				const { text } = TextSchema.parse(args);
				const result = await checkGrammar(text);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'analyze_tone': {
				const { text } = TextSchema.parse(args);
				const result = await analyzeTone(text);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'analyze_sentiment': {
				const { text } = TextSchema.parse(args);
				const result = await analyzeSentiment(text);
				return {
					content: [{ type: 'text', text: result }],
				};
			}

			case 'detect_ai_content': {
				const { text } = TextSchema.parse(args);
				const result = await detectAIContent(text);
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
	console.error('English MCP Server running on stdio');
}

runServer().catch((error) => {
	console.error('Fatal error running server:', error);
	process.exit(1);
});
