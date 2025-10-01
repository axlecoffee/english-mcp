import type {
	StructuredToolResponse,
	GrammarCheckResult,
	ToneAnalysisResult,
	SentimentAnalysisResult,
	AIDetectionResult,
	ThesaurusResult,
	DictionaryResult,
} from '../types.js';

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type ToolResult = CallToolResult;

export class ResponseFormatter {
	static formatThesaurus(result: ThesaurusResult): ToolResult {
		const totalSynonyms = result.entries.reduce(
			(sum, e) => sum + e.synonyms.length,
			0
		);
		const totalAntonyms = result.entries.reduce(
			(sum, e) => sum + e.antonyms.length,
			0
		);

		const structured: StructuredToolResponse = {
			success: true,
			tool: 'get_synonyms_antonyms',
			data: result,
			metadata: {
				entryCount: result.entries.length,
				totalSynonyms,
				totalAntonyms,
			},
		};

		let humanText = `**${result.word}**\n\n`;
		humanText += `Found ${result.entries.length} meaning(s):\n\n`;

		result.entries.forEach((entry, idx) => {
			humanText += `**${idx + 1}. ${entry.partOfSpeech || 'unknown'}**`;
			if (entry.id) {
				humanText += ` (${entry.id})`;
			}
			humanText += `\n`;

			if (entry.definitions.length > 0) {
				humanText += `   *Definitions*: ${entry.definitions.join(
					'; '
				)}\n`;
			}

			if (entry.synonyms.length > 0) {
				humanText += `   *Synonyms*: ${entry.synonyms.join(', ')}\n`;
			} else {
				humanText += `   *Synonyms*: none\n`;
			}

			if (entry.antonyms.length > 0) {
				humanText += `   *Antonyms*: ${entry.antonyms.join(', ')}\n`;
			} else {
				humanText += `   *Antonyms*: none\n`;
			}

			humanText += `\n`;
		});

		return {
			content: [
				{
					type: 'text',
					text: humanText.trim(),
				},
				{
					type: 'resource',
					resource: {
						uri: `english-mcp://result/thesaurus/${result.word}`,
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatDictionary(result: DictionaryResult): ToolResult {
		const structured: StructuredToolResponse = {
			success: true,
			tool: 'lookup_dictionary',
			data: result,
			metadata: {
				definitionCount: result.definitions.length,
				hasPartOfSpeech: !!result.partOfSpeech,
			},
		};

		let humanText = `**${result.word}**\n\n`;

		if (result.partOfSpeech) {
			humanText += `*${result.partOfSpeech}*\n\n`;
		}

		if (result.definitions.length > 0) {
			humanText += `**Definitions**:\n`;
			result.definitions.forEach((def, idx) => {
				humanText += `${idx + 1}. ${def}\n`;
			});
		}

		return {
			content: [
				{
					type: 'text',
					text: humanText,
				},
				{
					type: 'resource',
					resource: {
						uri: `english-mcp://result/dictionary/${result.word}`,
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatGrammarCheck(result: GrammarCheckResult): ToolResult {
		const structured: StructuredToolResponse = {
			success: true,
			tool: 'check_grammar',
			data: result,
			metadata: {
				errorCount: result.errorCount,
				categories: [
					...new Set(result.suggestions.map((s) => s.category)),
				],
			},
		};

		let humanText = '';
		if (result.errorCount === 0) {
			humanText = 'No grammar or spelling errors found.';
		} else {
			humanText = `Found ${result.errorCount} suggestion(s):\n\n`;
			result.suggestions.forEach((suggestion, idx) => {
				humanText += `${idx + 1}. **${suggestion.original}** → **${
					suggestion.replacement
				}**\n`;
				humanText += `   *${suggestion.category}*: ${suggestion.type}\n\n`;
			});
		}

		return {
			content: [
				{
					type: 'text',
					text: humanText,
				},
				{
					type: 'resource',
					resource: {
						uri: 'english-mcp://result/grammar-check',
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatToneAnalysis(result: ToneAnalysisResult): ToolResult {
		const structured: StructuredToolResponse = {
			success: true,
			tool: 'analyze_tone',
			data: result,
			metadata: {
				dominantToneCount: result.dominant.length,
				toneCount: Object.keys(result.scores).length,
			},
		};

		let humanText = `**Overall Tone**: ${result.overall}\n\n`;

		if (Object.keys(result.scores).length > 0) {
			humanText += `**Tone Breakdown**:\n`;
			Object.entries(result.scores).forEach(([tone, score]) => {
				humanText += `- ${tone}: ${(score * 100).toFixed(1)}%\n`;
			});
		}

		return {
			content: [
				{
					type: 'text',
					text: humanText,
				},
				{
					type: 'resource',
					resource: {
						uri: 'english-mcp://result/tone-analysis',
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatSentimentAnalysis(
		result: SentimentAnalysisResult
	): ToolResult {
		const structured: StructuredToolResponse = {
			success: true,
			tool: 'analyze_sentiment',
			data: result,
			metadata: {
				confidence: result.confidence,
			},
		};

		let humanText = `**Sentiment**: ${result.sentiment}\n`;
		humanText += `**Score**: ${(result.score * 100).toFixed(1)}%\n`;
		humanText += `**Confidence**: ${result.confidence}\n`;

		if (result.score > 0.6) {
			humanText += `\nThe text has a clearly positive sentiment.`;
		} else if (result.score < -0.6) {
			humanText += `\nThe text has a clearly negative sentiment.`;
		} else {
			humanText += `\nThe text has a neutral or mixed sentiment.`;
		}

		return {
			content: [
				{
					type: 'text',
					text: humanText,
				},
				{
					type: 'resource',
					resource: {
						uri: 'english-mcp://result/sentiment-analysis',
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatAIDetection(result: AIDetectionResult): ToolResult {
		const structured: StructuredToolResponse = {
			success: true,
			tool: 'detect_ai_content',
			data: result,
			metadata: {
				likelihood: result.likelihood,
				flaggedCount: result.flaggedSentences.length,
				suspiciousCount: result.suspiciousSentences.length,
			},
		};

		let humanText = `**Overall AI Detection Score**: ${(
			result.overallScore * 100
		).toFixed(1)}%\n\n`;

		if (result.likelihood === 'high') {
			humanText += `⚠️ **High likelihood** this content is AI-generated.\n`;
		} else if (result.likelihood === 'moderate') {
			humanText += `⚠️ **Moderate likelihood** this content may be AI-generated.\n`;
		} else {
			humanText += `✓ **Low likelihood** of AI generation. Content appears human-written.\n`;
		}

		if (result.flaggedSentences.length > 0) {
			humanText += `\n\n**${result.flaggedSentences.length} sentence(s) flagged as likely AI-generated** (score > 50%):\n`;
			result.flaggedSentences.forEach((item, idx) => {
				humanText += `\n${idx + 1}. [${(item.score * 100).toFixed(
					1
				)}%] "${item.text}"`;
			});
		}

		if (result.suspiciousSentences.length > 0) {
			humanText += `\n\n**${result.suspiciousSentences.length} sentence(s) may need review** (score 30-50%):\n`;
			result.suspiciousSentences.forEach((item, idx) => {
				humanText += `\n${idx + 1}. [${(item.score * 100).toFixed(
					1
				)}%] "${item.text}"`;
			});
		}

		if (
			result.flaggedSentences.length === 0 &&
			result.suspiciousSentences.length === 0 &&
			result.overallScore < 0.3
		) {
			humanText += `\n\n✓ All sentences appear human-written.`;
		}

		if (result.recommendations) {
			humanText += `\n\n**Recommendations**:\n`;
			result.recommendations.forEach((rec) => {
				humanText += `- ${rec}\n`;
			});
		}

		return {
			content: [
				{
					type: 'text',
					text: humanText,
				},
				{
					type: 'resource',
					resource: {
						uri: 'english-mcp://result/ai-detection',
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
		};
	}

	static formatError(tool: string, error: Error): ToolResult {
		const structured: StructuredToolResponse = {
			success: false,
			tool,
			error: error.message,
		};

		return {
			content: [
				{
					type: 'text',
					text: `Error: ${error.message}`,
				},
				{
					type: 'resource',
					resource: {
						uri: `english-mcp://error/${tool}`,
						mimeType: 'application/json',
						text: JSON.stringify(structured, null, 2),
					},
				},
			],
			isError: true,
		};
	}
}
