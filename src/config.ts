// API Configuration from environment variables
export const config = {
	merriamWebster: {
		thesaurusKey: process.env.MERRIAM_WEBSTER_THESAURUS_KEY || '',
		dictionaryKey: process.env.MERRIAM_WEBSTER_DICTIONARY_KEY || '',
	},
	sapling: {
		privateKey: process.env.SAPLING_PRIVATE_KEY || '',
		publicKey: process.env.SAPLING_PUBLIC_KEY || '',
	},
} as const;

export function validateConfig(): string[] {
	const errors: string[] = [];

	if (!config.merriamWebster.thesaurusKey) {
		errors.push('MERRIAM_WEBSTER_THESAURUS_KEY not configured');
	}
	if (!config.merriamWebster.dictionaryKey) {
		errors.push('MERRIAM_WEBSTER_DICTIONARY_KEY not configured');
	}
	if (!config.sapling.privateKey) {
		errors.push('SAPLING_PRIVATE_KEY not configured');
	}
	if (!config.sapling.publicKey) {
		errors.push('SAPLING_PUBLIC_KEY not configured');
	}

	return errors;
}
