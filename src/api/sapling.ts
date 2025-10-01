import { fetchJson } from '../utils/http.js';
import { config } from '../config.js';
import type {
	SaplingGrammarResponse,
	SaplingToneResponse,
	SaplingSentimentResponse,
	SaplingAIDetectionResponse,
	GrammarCheckResult,
	ToneAnalysisResult,
	SentimentAnalysisResult,
	AIDetectionResult,
} from '../types.js';

export class SaplingAPI {
	async checkGrammar(text: string): Promise<GrammarCheckResult> {
		if (!config.sapling.privateKey) {
			throw new Error('SAPLING_PRIVATE_KEY not configured');
		}

		const url = 'https://api.sapling.ai/api/v1/edits';
		const data = (await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: config.sapling.privateKey,
				text: text,
				session_id: `english-mcp-${Date.now()}`,
			}),
		})) as SaplingGrammarResponse;

		if (!data.edits || data.edits.length === 0) {
			return {
				errorCount: 0,
				suggestions: [],
			};
		}

		return {
			errorCount: data.edits.length,
			suggestions: data.edits.map((edit) => ({
				original: edit.sentence.slice(edit.start, edit.end),
				replacement: edit.replacement,
				type: edit.error_type,
				category: edit.general_error_type,
				position: {
					start: edit.start,
					end: edit.end,
				},
			})),
		};
	}

	async analyzeTone(text: string): Promise<ToneAnalysisResult> {
		if (!config.sapling.privateKey) {
			throw new Error('SAPLING_PRIVATE_KEY not configured');
		}

		const url = 'https://api.sapling.ai/api/v1/tone';
		const data = (await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: config.sapling.privateKey,
				text: text,
			}),
		})) as SaplingToneResponse;

		if (!data.overall) {
			throw new Error('Unable to determine tone');
		}

		const scores = data.tones || {};
		const dominant = Object.entries(scores)
			.filter(([_, score]) => score > 0.6)
			.map(([tone]) => tone);

		return {
			overall: data.overall,
			scores,
			dominant,
		};
	}

	async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
		if (!config.sapling.privateKey) {
			throw new Error('SAPLING_PRIVATE_KEY not configured');
		}

		const url = 'https://api.sapling.ai/api/v1/sentiment';
		const data = (await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: config.sapling.privateKey,
				text: text,
			}),
		})) as SaplingSentimentResponse;

		const sentiment = data.sentiment || 'neutral';
		const score = data.score || 0;

		let sentimentCategory: 'positive' | 'negative' | 'neutral';
		if (score > 0.6) {
			sentimentCategory = 'positive';
		} else if (score < -0.6) {
			sentimentCategory = 'negative';
		} else {
			sentimentCategory = 'neutral';
		}

		const absScore = Math.abs(score);
		let confidence: 'high' | 'medium' | 'low';
		if (absScore > 0.7) {
			confidence = 'high';
		} else if (absScore > 0.4) {
			confidence = 'medium';
		} else {
			confidence = 'low';
		}

		return {
			sentiment: sentimentCategory,
			score,
			confidence,
		};
	}

	async detectAI(text: string): Promise<AIDetectionResult> {
		if (!config.sapling.privateKey) {
			throw new Error('SAPLING_PRIVATE_KEY not configured');
		}

		const url = 'https://api.sapling.ai/api/v1/aidetect';
		const data = (await fetchJson(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: config.sapling.privateKey,
				text: text,
			}),
		})) as SaplingAIDetectionResponse;

		const score = data.score || 0;
		const sentenceScores = data.sentence_scores || [];

		let likelihood: 'high' | 'moderate' | 'low';
		if (score > 0.8) {
			likelihood = 'high';
		} else if (score > 0.5) {
			likelihood = 'moderate';
		} else {
			likelihood = 'low';
		}

		const flaggedSentences = sentenceScores
			.filter((s) => s.score > 0.5)
			.map((s, idx) => ({
				text:
					s.sentence.length > 80
						? s.sentence.substring(0, 77) + '...'
						: s.sentence,
				score: s.score,
				index: idx,
			}));

		const suspiciousSentences = sentenceScores
			.filter((s) => s.score > 0.3 && s.score <= 0.5)
			.map((s, idx) => ({
				text:
					s.sentence.length > 80
						? s.sentence.substring(0, 77) + '...'
						: s.sentence,
				score: s.score,
				index: idx,
			}));

		const recommendations: string[] = [];
		if (score > 0.5) {
			recommendations.push(
				'Rewrite flagged sentences with more personality and variation'
			);
			recommendations.push('Add personal anecdotes or specific examples');
			recommendations.push('Vary sentence structure and vocabulary');
			recommendations.push(
				'Use contractions and informal language where appropriate'
			);
		}

		return {
			overallScore: score,
			likelihood,
			flaggedSentences,
			suspiciousSentences,
			recommendations:
				recommendations.length > 0 ? recommendations : undefined,
		};
	}
}
