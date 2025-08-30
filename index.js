// ===================================================================
// AFROPAIR TRANSLATION PIPELINE - Node.js Implementation
// French → Mooré Translation Data Generation System
// ===================================================================

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ===================================================================
// 1. SPLITTER MODULE (Mandatory)
// ===================================================================
class Splitter {
    static async process(inputJSON) {
        const { src } = inputJSON;
        
        // Simple sentence splitting - can be enhanced later
        const sentences = src.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        const segments = sentences.map((sentence, index) => ({
            seg_id: `s${index + 1}`,
            text: sentence.trim(),
            tokens: this.tokenize(sentence.trim()),
            start: 0, // Could calculate actual positions
            end: sentence.trim().length
        }));

        return {
            step: "splitter",
            segments: segments,
            meta: { 
                timestamp: Date.now(),
                provenance: ["splitter_v1"]
            }
        };
    }

    static tokenize(text) {
        // Simple tokenization - split on whitespace and punctuation
        return text.split(/[\s\p{P}]+/u).filter(token => token.length > 0);
    }
}

// ===================================================================
// 2. DICTIONARY LOOKUP MODULE (Mandatory)
// ===================================================================
class DictionaryLookup {
    constructor(dictPath = './data/fr_mos_dict.tsv') {
        this.dictPath = dictPath;
        this.dictionary = new Map();
        this.loaded = false;
    }

    async loadDictionary() {
        if (this.loaded) return;
        
        try {
            const data = await fs.readFile(this.dictPath, 'utf-8');
            const lines = data.split('\n').filter(line => line.trim());
            
            // Expected format: fr_word\tmos_word\tpos\tscore
            for (const line of lines) {
                const [frWord, mosWord, pos, score] = line.split('\t');
                if (frWord && mosWord) {
                    const key = frWord.toLowerCase();
                    if (!this.dictionary.has(key)) {
                        this.dictionary.set(key, []);
                    }
                    this.dictionary.get(key).push({
                        mos: mosWord,
                        pos: pos || 'UNK',
                        score: parseFloat(score) || 0.5
                    });
                }
            }
            this.loaded = true;
            console.log(`Dictionary loaded: ${this.dictionary.size} entries`);
        } catch (error) {
            console.warn(`Dictionary not found at ${this.dictPath}, using empty dictionary`);
            this.loaded = true;
        }
    }

    async process(inputJSON) {
        await this.loadDictionary();
        
        const { segments } = inputJSON;
        const results = {};

        for (const segment of segments) {
            const segmentResults = {};
            
            for (const token of segment.tokens) {
                const key = token.toLowerCase();
                const candidates = this.dictionary.get(key) || [];
                
                if (candidates.length === 0) {
                    // Unknown word - could be enhanced with lemmatization
                    segmentResults[token] = [{
                        mos: `<UNK:${token}>`,
                        pos: 'UNK',
                        score: 0.1
                    }];
                } else {
                    segmentResults[token] = candidates;
                }
            }
            
            results[segment.seg_id] = segmentResults;
        }

        return {
            step: "dictionary_lookup",
            dictionary_results: results,
            meta: {
                timestamp: Date.now(),
                provenance: ["dict_lookup_v1"],
                dict_coverage: this.calculateCoverage(results)
            }
        };
    }

    calculateCoverage(results) {
        let total = 0;
        let covered = 0;
        
        for (const segId in results) {
            for (const token in results[segId]) {
                total++;
                if (results[segId][token][0].score > 0.1) {
                    covered++;
                }
            }
        }
        
        return total > 0 ? covered / total : 0;
    }
}

// ===================================================================
// 3. CORPUS RETRIEVER MODULE (Mandatory)
// ===================================================================
class CorpusRetriever {
    constructor(corpusPath = './data/fr_mos_corpus.jsonl') {
        this.corpusPath = corpusPath;
        this.corpus = [];
        this.loaded = false;
    }

    async loadCorpus() {
        if (this.loaded) return;
        
        try {
            const data = await fs.readFile(this.corpusPath, 'utf-8');
            const lines = data.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    if (entry.fr && entry.mos) {
                        this.corpus.push(entry);
                    }
                } catch (e) {
                    console.warn(`Invalid JSON line in corpus: ${line}`);
                }
            }
            
            this.loaded = true;
            console.log(`Corpus loaded: ${this.corpus.size} entries`);
        } catch (error) {
            console.warn(`Corpus not found at ${this.corpusPath}, using empty corpus`);
            this.loaded = true;
        }
    }

    async process(inputJSON) {
        await this.loadCorpus();
        
        const { segments } = inputJSON;
        const results = [];

        for (const segment of segments) {
            const matches = this.searchCorpus(segment.text);
            results.push({
                seg_id: segment.seg_id,
                matches: matches
            });
        }

        return {
            step: "corpus_retriever",
            corpus_results: results,
            meta: {
                timestamp: Date.now(),
                provenance: ["corpus_retriever_v1"]
            }
        };
    }

    searchCorpus(query) {
        const matches = [];
        const queryLower = query.toLowerCase();
        
        for (const entry of this.corpus) {
            const similarity = this.calculateSimilarity(queryLower, entry.fr.toLowerCase());
            
            if (similarity > 0.6) { // Threshold for relevance
                matches.push({
                    fr: entry.fr,
                    mos: entry.mos,
                    sim: similarity,
                    source: entry.source || 'unknown'
                });
            }
        }
        
        // Sort by similarity descending
        return matches.sort((a, b) => b.sim - a.sim).slice(0, 5);
    }

    calculateSimilarity(str1, str2) {
        // Simple Jaccard similarity - can be enhanced with better algorithms
        const set1 = new Set(str1.split(/\s+/));
        const set2 = new Set(str2.split(/\s+/));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
}

// ===================================================================
// 4. REFEREE/SYNTHESIZER MODULE (Mandatory)
// ===================================================================
class Referee {
    async process(inputJSON) {
        const { segments, dictionary_results, corpus_results } = inputJSON;
        const finalResults = [];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const dictResult = dictionary_results[segment.seg_id];
            const corpusResult = corpus_results[i];
            
            const decision = this.makeDecision(segment, dictResult, corpusResult);
            finalResults.push(decision);
        }

        return {
            step: "referee",
            final_results: finalResults,
            meta: {
                timestamp: Date.now(),
                provenance: ["referee_v1"]
            }
        };
    }

    makeDecision(segment, dictResult, corpusResult) {
        const candidates = [];
        
        // Add corpus matches (highest priority)
        if (corpusResult.matches && corpusResult.matches.length > 0) {
            for (const match of corpusResult.matches) {
                candidates.push({
                    mos: match.mos,
                    source: "corpus",
                    confidence: match.sim,
                    details: match
                });
            }
        }
        
        // Add dictionary composition (fallback)
        if (dictResult) {
            const dictComposition = this.composeDictionaryTranslation(dictResult);
            if (dictComposition.mos.trim().length > 0) {
                candidates.push({
                    mos: dictComposition.mos,
                    source: "dictionary",
                    confidence: dictComposition.confidence,
                    details: dictComposition
                });
            }
        }
        
        // Select best candidate
        const bestCandidate = candidates.length > 0 
            ? candidates.reduce((best, current) => 
                current.confidence > best.confidence ? current : best)
            : { mos: `<UNTRANSLATED:${segment.text}>`, source: "none", confidence: 0.0 };
        
        return {
            seg_id: segment.seg_id,
            src_text: segment.text,
            final: bestCandidate.mos,
            candidates: candidates,
            explanation: this.generateExplanation(bestCandidate, candidates)
        };
    }

    composeDictionaryTranslation(dictResult) {
        const mosWords = [];
        let totalScore = 0;
        let wordCount = 0;
        
        for (const token in dictResult) {
            const candidates = dictResult[token];
            if (candidates && candidates.length > 0) {
                const best = candidates[0]; // Take highest scored candidate
                mosWords.push(best.mos);
                totalScore += best.score;
                wordCount++;
            }
        }
        
        return {
            mos: mosWords.join(' '),
            confidence: wordCount > 0 ? totalScore / wordCount : 0.0,
            word_count: wordCount
        };
    }

    generateExplanation(bestCandidate, candidates) {
        if (candidates.length === 0) {
            return "No translation candidates found";
        }
        
        if (bestCandidate.source === "corpus") {
            return `Corpus match selected with ${(bestCandidate.confidence * 100).toFixed(1)}% similarity`;
        } else if (bestCandidate.source === "dictionary") {
            return `Dictionary composition with ${(bestCandidate.confidence * 100).toFixed(1)}% average word confidence`;
        }
        
        return "Fallback translation used";
    }
}

// ===================================================================
// 5. SCORER MODULE (Mandatory)
// ===================================================================
class Scorer {
    async process(inputJSON) {
        const { final_results } = inputJSON;
        const scoredResults = [];

        for (const result of final_results) {
            const compositeScore = this.calculateCompositeScore(result);
            scoredResults.push({
                ...result,
                composite_confidence: compositeScore.confidence,
                quality_features: compositeScore.features
            });
        }

        return {
            step: "scorer",
            scored_results: scoredResults,
            meta: {
                timestamp: Date.now(),
                provenance: ["scorer_v1"]
            }
        };
    }

    calculateCompositeScore(result) {
        const features = {
            source_confidence: 0.0,
            candidate_count: result.candidates.length,
            length_ratio: 0.0,
            unknown_words: 0
        };

        // Source confidence (highest priority)
        if (result.candidates.length > 0) {
            features.source_confidence = result.candidates[0].confidence;
        }

        // Penalty for unknown words
        const unknownMatches = result.final.match(/<UNK:/g);
        features.unknown_words = unknownMatches ? unknownMatches.length : 0;
        
        // Length ratio check (basic sanity)
        const srcLength = result.src_text.length;
        const tgtLength = result.final.length;
        features.length_ratio = srcLength > 0 ? Math.min(tgtLength / srcLength, srcLength / tgtLength) : 0;

        // Composite confidence calculation
        let confidence = features.source_confidence;
        
        // Penalties
        if (features.unknown_words > 0) {
            confidence *= Math.pow(0.7, features.unknown_words);
        }
        
        if (features.length_ratio < 0.3) {
            confidence *= 0.8; // Length mismatch penalty
        }

        // Bonus for multiple candidates (validation)
        if (features.candidate_count > 1) {
            confidence = Math.min(1.0, confidence * 1.1);
        }

        return {
            confidence: Math.max(0.0, Math.min(1.0, confidence)),
            features
        };
    }
}

// ===================================================================
// 6. LOGGER MODULE (Mandatory)
// ===================================================================
class Logger {
    constructor(outputPath = './output/translations.jsonl') {
        this.outputPath = outputPath;
    }

    async process(inputJSON) {
        const { scored_results, id, src_lang, tgt_lang } = inputJSON;
        const records = [];

        for (const result of scored_results) {
            const record = {
                id: uuidv4(),
                parent_id: id,
                src_lang: src_lang || "fr",
                tgt_lang: tgt_lang || "mos",
                src: result.src_text,
                tgt: result.final,
                confidence: result.composite_confidence,
                features: result.quality_features,
                candidates: result.candidates,
                explanation: result.explanation,
                status: this.determineStatus(result.composite_confidence),
                timestamp: Date.now(),
                pipeline_version: "afropair_v1"
            };

            records.push(record);
        }

        // Ensure output directory exists
        await fs.mkdir(path.dirname(this.outputPath), { recursive: true });
        
        // Write records to JSONL
        const jsonlContent = records.map(record => JSON.stringify(record)).join('\n') + '\n';
        await fs.appendFile(this.outputPath, jsonlContent);

        console.log(`Logged ${records.length} translation records to ${this.outputPath}`);

        return {
            step: "logger",
            logged_count: records.length,
            output_path: this.outputPath,
            records: records,
            meta: {
                timestamp: Date.now(),
                provenance: ["logger_v1"]
            }
        };
    }

    determineStatus(confidence) {
        if (confidence >= 0.8) return "auto_accepted";
        if (confidence >= 0.5) return "review_recommended";
        return "manual_review_required";
    }
}

// ===================================================================
// 7. MAIN PIPELINE ORCHESTRATOR
// ===================================================================
class AfropairPipeline {
    constructor(config = {}) {
        this.config = {
            dictPath: config.dictPath || './data/fr_mos_dict.tsv',
            corpusPath: config.corpusPath || './data/fr_mos_corpus.jsonl',
            outputPath: config.outputPath || './output/translations.jsonl',
            ...config
        };

        // Initialize modules
        this.splitter = Splitter;
        this.dictLookup = new DictionaryLookup(this.config.dictPath);
        this.corpusRetriever = new CorpusRetriever(this.config.corpusPath);
        this.referee = new Referee();
        this.scorer = new Scorer();
        this.logger = new Logger(this.config.outputPath);
    }

    async translateSentence(frenchSentence, options = {}) {
        const startTime = Date.now();
        const translationId = uuidv4();
        
        console.log(`\n=== Translation Pipeline Started ===`);
        console.log(`ID: ${translationId}`);
        console.log(`Input: "${frenchSentence}"`);

        try {
            // Initialize pipeline context
            let context = {
                id: translationId,
                src_lang: "fr",
                tgt_lang: "mos",
                src: frenchSentence,
                step: "init",
                ...options
            };

            // 1. Splitter
            console.log(`\n1. Running Splitter...`);
            const splitResult = await this.splitter.process(context);
            context = { ...context, ...splitResult };
            console.log(`   Found ${splitResult.segments.length} segments`);

            // 2. Dictionary Lookup
            console.log(`\n2. Running Dictionary Lookup...`);
            const dictResult = await this.dictLookup.process(context);
            context = { ...context, ...dictResult };
            console.log(`   Dictionary coverage: ${(dictResult.meta.dict_coverage * 100).toFixed(1)}%`);

            // 3. Corpus Retriever
            console.log(`\n3. Running Corpus Retriever...`);
            const corpusResult = await this.corpusRetriever.process(context);
            context = { ...context, ...corpusResult };
            const totalMatches = corpusResult.corpus_results.reduce((sum, r) => sum + r.matches.length, 0);
            console.log(`   Found ${totalMatches} corpus matches`);

            // 4. Referee
            console.log(`\n4. Running Referee...`);
            const refereeResult = await this.referee.process(context);
            context = { ...context, ...refereeResult };
            console.log(`   Selected best translations for ${refereeResult.final_results.length} segments`);

            // 5. Scorer
            console.log(`\n5. Running Scorer...`);
            const scorerResult = await this.scorer.process(context);
            context = { ...context, ...scorerResult };
            const avgConfidence = scorerResult.scored_results.reduce((sum, r) => sum + r.composite_confidence, 0) / scorerResult.scored_results.length;
            console.log(`   Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);

            // 6. Logger
            console.log(`\n6. Running Logger...`);
            const logResult = await this.logger.process(context);
            context = { ...context, ...logResult };

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`\n=== Translation Pipeline Complete ===`);
            console.log(`Duration: ${duration}ms`);
            console.log(`Final Translation: "${logResult.records[0]?.tgt || 'ERROR'}"`);
            console.log(`Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

            return {
                success: true,
                translation: logResult.records[0]?.tgt || '',
                confidence: avgConfidence,
                duration: duration,
                records: logResult.records,
                context: context
            };

        } catch (error) {
            console.error(`\n=== Pipeline Error ===`);
            console.error(error);
            
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async batchTranslate(frenchSentences, options = {}) {
        console.log(`\n=== Batch Translation Started ===`);
        console.log(`Processing ${frenchSentences.length} sentences`);
        
        const results = [];
        let successCount = 0;
        
        for (let i = 0; i < frenchSentences.length; i++) {
            const sentence = frenchSentences[i];
            console.log(`\n--- Sentence ${i + 1}/${frenchSentences.length} ---`);
            
            const result = await this.translateSentence(sentence, options);
            results.push(result);
            
            if (result.success) {
                successCount++;
            }
        }
        
        console.log(`\n=== Batch Complete ===`);
        console.log(`Success: ${successCount}/${frenchSentences.length}`);
        
        return {
            total: frenchSentences.length,
            successful: successCount,
            results: results
        };
    }
}

// ===================================================================
// 8. EXAMPLE USAGE & TEST HARNESS
// ===================================================================
async function runTestHarness() {
    console.log("🚀 Afropair Pipeline Test Harness");
    
    const pipeline = new AfropairPipeline();
    
    const testSentences = [
        "Je vais au marché.",
        "Bonjour, comment allez-vous?",
        "J'aime manger du riz.",
        "Il fait chaud aujourd'hui.",
        "Où est la maison?",
        "Elle est très belle.",
        "Nous partons demain.",
        "Combien ça coûte?",
        "Je ne comprends pas.",
        "Merci beaucoup.",
        "Au revoir!",
        "Quelle heure est-il?",
        "J'ai soif.",
        "Le soleil brille.",
        "Les enfants jouent.",
        "C'est delicieux.",
        "Je suis fatigué.",
        "Bonne nuit.",
        "Quel est votre nom?",
        "Je viens du Burkina Faso."
    ];
    
    const results = await pipeline.batchTranslate(testSentences);
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`Total sentences: ${results.total}`);
    console.log(`Successful translations: ${results.successful}`);
    console.log(`Success rate: ${(results.successful / results.total * 100).toFixed(1)}%`);
    
    return results;
}

// ===================================================================
// 9. MODULE EXPORTS
// ===================================================================
module.exports = {
    AfropairPipeline,
    Splitter,
    DictionaryLookup,
    CorpusRetriever,
    Referee,
    Scorer,
    Logger,
    runTestHarness
};

// Run test harness if this file is executed directly
if (require.main === module) {
    runTestHarness().catch(console.error);
}