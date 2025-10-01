import { SaplingAPI } from '../api/sapling.js';
import { ResponseFormatter } from '../responses/formatters.js';
import type { ToolResult } from '../responses/formatters.js';

const api = new SaplingAPI();

export async function detectAIContent(text: string): Promise<ToolResult> {
	try {
		const result = await api.detectAI(text);
		return ResponseFormatter.formatAIDetection(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'detect_ai_content',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}
