/* 
* A simple text splitter that divides input text into sentences and tokens.
* It processes a JSON input with a "src" field and outputs a structured JSON.
* in a standard Afropair pipeline format this is the first step. The next step is usually the dictionary lookup.
* Example input:
* {
*   "src": "Bonjour, comment ça va? Je vais bien."
* }
* Example output:
* {
*   "step": "splitter",
*   "segments": [
*     {
*       "seg_id": "s1",
*       "text": "Bonjour, comment ça va?",
*       "tokens": ["Bonjour", ",", "comment", "ça", "va", "?"],
*       "start": 0,
*       "end": 27
*     },
*     {
*       "seg_id": "s2",
*       "text": "Je vais bien.",
*       "tokens": ["Je", "vais", "bien", "."],
*       "start": 28,
*       "end": 42
*     }
*   ],
*   "meta": {
*     "timestamp": 1633036800000,
*     "provenance": ["splitter_v1"] // Example provenance
*   }
* }
*/
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
