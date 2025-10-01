import { SaplingAPI } from '../api/sapling.js';
import { ResponseFormatter } from '../responses/formatters.js';
import type { ToolResult } from '../responses/formatters.js';

const api = new SaplingAPI();

export async function checkGrammar(text: string): Promise<ToolResult> {
	try {
		const result = await api.checkGrammar(text);
		return ResponseFormatter.formatGrammarCheck(result);
	} catch (error) {
		return ResponseFormatter.formatError(
			'check_grammar',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}
