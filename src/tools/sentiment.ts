import { SaplingAPI } from '../api/sapling.js';
import { ResponseFormatter } from '../responses/formatters.js';
import type { ToolResult } from '../responses/formatters.js';

const api = new SaplingAPI();

export async function analyzeSentiment(text: string): Promise<ToolResult> {
	try {
		const result = await api.analyzeSentiment(text);
		return ResponseFormatter.formatSentimentAnalysis(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'analyze_sentiment',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}
