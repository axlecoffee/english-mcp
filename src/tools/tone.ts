import { SaplingAPI } from '../api/sapling.js';
import { ResponseFormatter } from '../responses/formatters.js';
import type { ToolResult } from '../responses/formatters.js';

const api = new SaplingAPI();

export async function analyzeTone(text: string): Promise<ToolResult> {
	try {
		const result = await api.analyzeTone(text);
		return ResponseFormatter.formatToneAnalysis(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'analyze_tone',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}
