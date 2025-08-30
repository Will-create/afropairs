/*
* This is the embedding utility module. It provides functions to generate text embeddings using various embedding models.
* In a standard Afropair pipeline, this is usually used after the dictionary lookup and translation steps to generate embeddings for text data.
* It is designed to work with different embedding models, allowing for flexibility in choosing the best model for specific tasks.
* The module can be extended to include additional functionality such as batch processing, caching, and more.
* Example usage:
* const embedding = new Embedding('openai', 'text-embedding-ada-002');
* const vector = await embedding.embed('Bonjour');
* console.log(vector); // Outputs: [0.1, 0.2, 0.3, ...]
*/
class Embedding {
    constructor(provider = 'openai', model = 'text-embedding-ada-002') {
        this.provider = provider;
        this.model = model;
        // Initialize the embedding model based on the provider
        if (provider === 'openai') {
            const { Configuration, OpenAIApi } = require('openai');
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            this.client = new OpenAIApi(configuration);
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async embed(text) {
        if (this.provider === 'openai') {
            const response = await this.client.createEmbedding({
                model: this.model,
                input: text,
            });
            return response.data.data[0].embedding;
        } else {
            throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }
}

module.exports = Embedding;