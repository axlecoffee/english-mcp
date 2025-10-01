import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TextstatResults {
	flesch_reading_ease: number;
	flesch_kincaid_grade: number;
	gunning_fog: number;
	smog_index: number;
	automated_readability_index: number;
	coleman_liau_index: number;
	linsear_write_formula: number;
	dale_chall_readability_score: number;
	difficult_words: number;
	text_standard: string;
	reading_time: number;
	syllable_count: number;
	lexicon_count: number;
	sentence_count: number;
	char_count: number;
	letter_count: number;
	polysyllabcount: number;
	monosyllabcount: number;
}

/**
 * Analyzes text readability using Python textstat library.
 */
export async function analyzeReadability(
	text: string
): Promise<TextstatResults> {
	if (!text || text.trim().length === 0) {
		throw new Error('Text cannot be empty');
	}

	const pythonScript = join(__dirname, 'textstat-helper.py');

	return new Promise((resolve, reject) => {
		const python = spawn('python', [pythonScript]);

		let stdout = '';
		let stderr = '';

		python.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		python.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		python.on('close', (code) => {
			if (code !== 0) {
				try {
					const errorData = JSON.parse(stdout);
					reject(
						new Error(
							`Python textstat error: ${errorData.error} (${errorData.type})`
						)
					);
				} catch {
					reject(
						new Error(
							`Python process failed with code ${code}: ${stderr}`
						)
					);
				}
				return;
			}

			try {
				const results = JSON.parse(stdout) as TextstatResults;
				resolve(results);
			} catch (error) {
				reject(
					new Error(
						`Failed to parse textstat results: ${
							error instanceof Error
								? error.message
								: 'Unknown error'
						}`
					)
				);
			}
		});

		python.on('error', (error) => {
			reject(
				new Error(`Failed to spawn Python process: ${error.message}`)
			);
		});

		python.stdin.write(JSON.stringify({ text }));
		python.stdin.end();
	});
}
