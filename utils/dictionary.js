/*
* This is the dictionary utility module. It provides functions to load and query a bilingual dictionary.
* In a standard Afropair pipeline, this is usually the second step after text splitting. It is a tsv dictionary wrapper. 
* i is designed to load a tab-separated values (TSV) file containing word pairs and provide lookup functionality.
* it also contains functions to load entries and add, list, read, update and delete entries to the dictionary. And it can be used to translate text based on the dictionary entries.
* There are many ways to improve this dictionary utility, such as adding support for more complex lookup strategies, handling multi-word expressions, or integrating with external dictionary services.
* There are some required fields in the dictionary tsv file such as "source", "target", "pos" (part of speech), "freq" (frequency), and "notes". However, the dictionary can contain additional fields as needed. they just have to be added in the config file.
* Example dictionary entry (TSV format):
* source	target	pos	freq	notes
* bonjour	nɛ bɛɛ̀dã	interjection	1000	common greeting
* maison	bonā	noun	800	house
* Example usage:
* const dict = new Dictionary('./data/fr_mos_dict.tsv');
* await dict.load();
* const translation = dict.lookup('bonjour');
* console.log(translation); // Outputs: nɛ bɛɛ̀dã
*/