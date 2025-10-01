import { fetchJson } from '../utils/http.js';

const BASE_URL = 'https://api.languagetool.org/v2';

export interface LanguageToolMatch {
	message: string;
	shortMessage?: string;
	offset: number;
	length: number;
	replacements: Array<{ value: string }>;
	context: {
		text: string;
		offset: number;
		length: number;
	};
	rule: {
		id: string;
		description: string;
		issueType: string;
		category: {
			id: string;
			name: string;
		};
	};
	type?: {
		typeName: string;
	};
}

export interface LanguageToolResult {
	matches: LanguageToolMatch[];
	language: {
		name: string;
		code: string;
	};
}

/**
 * Client for LanguageTool API.
 * Free tier: 20 requests/min
 */
export class LanguageToolClient {
	/**
	 * Check text for grammar and style issues
	 */
	async checkText(params: {
		text: string;
		language?: string;
		enabledOnly?: boolean;
	}): Promise<LanguageToolResult> {
		const { text, language = 'en-US', enabledOnly = false } = params;

		const formData = new URLSearchParams();
		formData.set('text', text);
		formData.set('language', language);
		if (enabledOnly) {
			formData.set('enabledOnly', 'true');
		}

		const url = `${BASE_URL}/check`;

		const result = await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData.toString(),
		});

		return result as LanguageToolResult;
	}

	/**
	 * Get supported languages
	 */
	async getLanguages(): Promise<
		Array<{ name: string; code: string; longCode: string }>
	> {
		return fetchJson(`${BASE_URL}/languages`);
	}

	/**
	 * Check text and categorize errors
	 */
	async checkWithCategories(
		text: string,
		language: string = 'en-US'
	): Promise<{
		totalErrors: number;
		grammar: LanguageToolMatch[];
		spelling: LanguageToolMatch[];
		style: LanguageToolMatch[];
		other: LanguageToolMatch[];
	}> {
		const result = await this.checkText({ text, language });

		const categorized = {
			totalErrors: result.matches.length,
			grammar: [] as LanguageToolMatch[],
			spelling: [] as LanguageToolMatch[],
			style: [] as LanguageToolMatch[],
			other: [] as LanguageToolMatch[],
		};

		result.matches.forEach((match) => {
			const category = match.rule.category.id.toLowerCase();
			if (category.includes('grammar')) {
				categorized.grammar.push(match);
			} else if (
				category.includes('typo') ||
				category.includes('spelling')
			) {
				categorized.spelling.push(match);
			} else if (
				category.includes('style') ||
				category.includes('redundancy')
			) {
				categorized.style.push(match);
			} else {
				categorized.other.push(match);
			}
		});

		return categorized;
	}
}
