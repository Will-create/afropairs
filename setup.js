
const fs = require('fs').promises;
const path = require('path');

async function createDirectories() {
    const dirs = ['./data', './output'];
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

async function createSampleDictionary() {
    const dictPath = './data/fr_mos_dict.tsv';
    
    const sampleDict = `fr_word	mos_word	pos	score
je	ànɛ	PRON	0.95
tu	fɔɛ́	PRON	0.95
il	à	PRON	0.90
elle	à	PRON	0.90
nous	tɩ̂	PRON	0.95
vous	yɛ̂	PRON	0.95
ils	bà	PRON	0.90
elles	bà	PRON	0.90
aller	zɩ̀	VERB	0.98
venir	kɔɛ̂	VERB	0.95
être	yã	VERB	0.98
avoir	tɩ̂	VERB	0.95
faire	kẽ	VERB	0.90
voir	nyɛɛ̀	VERB	0.95
dire	tɛɛ́	VERB	0.92
savoir	sɔ̃b	VERB	0.88
marché	zaabā	NOUN	0.97
maison	yĩ̃	NOUN	0.98
eau	kõom	NOUN	0.99
pain	bɛɛ̀d	NOUN	0.95
riz	rĩis	NOUN	0.96
viande	nam	NOUN	0.94
au	nà	PREP	0.85
du	nà	PREP	0.80
de	nà	PREP	0.82
le	la	DET	0.75
la	la	DET	0.75
les	la	DET	0.70
un	yɛɛ̀n	DET	0.80
une	yɛɛ̀n	DET	0.80
bonjour	nɛ bɛɛ̀dã	INTJ	0.95
merci	bɛɛlg kɩ̀tā	INTJ	0.98
au revoir	nɛ tɩ̂ sɔ́gẽ	INTJ	0.92
comment	yɛ	ADV	0.90
où	bonā	ADV	0.95
quand	gõn yã	ADV	0.85
pourquoi	sɛbkã	ADV	0.80
combien	yɛɛ̀b	ADV	0.88
aujourd'hui	tɩ̂ dãar	ADV	0.92
demain	kɩsã	ADV	0.95
hier	tɩneerã	ADV	0.90
beau	kɩ̃	ADJ	0.85
grand	gãnd	ADJ	0.88
petit	bɩɩ̀g	ADJ	0.90
bon	kɩ̃	ADJ	0.87
mauvais	yùub	ADJ	0.82
chaud	gũunã	ADJ	0.93
froid	yùupĩ	ADJ	0.88`;

    await fs.writeFile(dictPath, sampleDict);
    console.log(`Created sample dictionary: ${dictPath}`);
}

async function createSampleCorpus() {
    const corpusPath = './data/fr_mos_corpus.jsonl';
    
    const sampleCorpus = [
        { "fr": "Je vais au marché.", "mos": "N zɩ̀ nà zaabā.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Bonjour, comment allez-vous?", "mos": "Nɛ bɛɛ̀dã, yɛ fɔ yã?", "source": "manual_v1", "sim": 1.0 },
        { "fr": "J'aime manger du riz.", "mos": "N zɔg rĩis dĩim.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Il fait chaud aujourd'hui.", "mos": "Tɩ̂ dãar la gũunã.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Où est la maison?", "mos": "Yĩ̃ la bonā?", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Elle est très belle.", "mos": "À kɩ̃ sɩ́ndã.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Merci beaucoup.", "mos": "Bɛɛlg kɩ̀tā sɩ́ndã.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Au revoir!", "mos": "Nɛ tɩ̂ sɔ́gẽ!", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Je ne comprends pas.", "mos": "N kà sɔ̃b.", "source": "manual_v1", "sim": 1.0 },
        { "fr": "Combien ça coûte?", "mos": "A tɩ̂ yɛɛ̀b?", "source": "manual_v1", "sim": 1.0 }
    ];

    const jsonlContent = sampleCorpus.map(entry => JSON.stringify(entry)).join('\n');
    await fs.writeFile(corpusPath, jsonlContent);
    console.log(`Created sample corpus: ${corpusPath}`);
}

async function createEnvFile() {
    const envContent = `# Afropair Pipeline Configuration
DICT_PATH=./data/fr_mos_dict.tsv
CORPUS_PATH=./data/fr_mos_corpus.jsonl
OUTPUT_PATH=./output/translations.jsonl
LOG_LEVEL=info`;

    await fs.writeFile('./.env', envContent);
    console.log('Created .env configuration file');
}

async function main() {
    console.log('🚀 Setting up Afropair Pipeline...\n');
    
    try {
        await createDirectories();
        await createSampleDictionary();
        await createSampleCorpus();
        await createEnvFile();
        
        console.log('\n✅ Setup complete!');
        console.log('\nNext steps:');
        console.log('1. npm install');
        console.log('2. npm start');
        console.log('\nOr run individual components:');
        console.log('- node afropair.js (run test harness)');
        console.log('- Check ./output/translations.jsonl for results');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
