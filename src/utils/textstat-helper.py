#!/usr/bin/env python3
"""
Textstat helper script for English MCP server.
Reads text from stdin, performs readability analysis, outputs JSON to stdout.
"""

import sys
import json
import textstat

def analyze_text(text):
	"""
	Analyze text readability using textstat library.
	Returns dict of all readability metrics.
	"""
	if not text or not text.strip():
		raise ValueError("Text cannot be empty")

	return {
		"flesch_reading_ease": textstat.flesch_reading_ease(text),
		"flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
		"gunning_fog": textstat.gunning_fog(text),
		"smog_index": textstat.smog_index(text),
		"automated_readability_index": textstat.automated_readability_index(text),
		"coleman_liau_index": textstat.coleman_liau_index(text),
		"linsear_write_formula": textstat.linsear_write_formula(text),
		"dale_chall_readability_score": textstat.dale_chall_readability_score(text),
		"difficult_words": textstat.difficult_words(text),
		"linsear_write_formula": textstat.linsear_write_formula(text),
		"text_standard": textstat.text_standard(text, float_output=False),
		"reading_time": textstat.reading_time(text, ms_per_char=14.69),
		"syllable_count": textstat.syllable_count(text),
		"lexicon_count": textstat.lexicon_count(text, removepunct=True),
		"sentence_count": textstat.sentence_count(text),
		"char_count": textstat.char_count(text, ignore_spaces=True),
		"letter_count": textstat.letter_count(text, ignore_spaces=True),
		"polysyllabcount": textstat.polysyllabcount(text),
		"monosyllabcount": textstat.monosyllabcount(text)
	}

def main():
	try:
		input_data = json.load(sys.stdin)
		text = input_data.get('text', '')
		
		if not text:
			raise ValueError("No text provided in input JSON")
		
		results = analyze_text(text)
		json.dump(results, sys.stdout)
		sys.exit(0)
		
	except Exception as e:
		error_output = {
			"error": str(e),
			"type": type(e).__name__
		}
		json.dump(error_output, sys.stdout)
		sys.exit(1)

if __name__ == '__main__':
	main()
