/*
This is an abstraction layer for the large language models. They will abstract away the different LLM providers such as OpenAI, HuggingFace, etc.
In a standard Afropair pipeline, this is usually the last step after text splitting, dictionary lookup, and vector store.
It is designed to provide a consistent interface for interacting with different LLMs, allowing for easy switching between providers or models.
The module can be extended to include additional functionality such as prompt engineering, response parsing, and more.
It will dynamically load the appropriate LLM provider based on the configuration settings.
*/

// import necessary libraries for different providers
class Model {
    constructor(provider = 'openai', model = 'gpt-3.5-turbo') {
        this.provider = provider;
        this.model = model;
        // Initialize the model based on the provider
        if (provider === 'openai') {
            const { Configuration, OpenAIApi } = require('openai');
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
                baseurl: process.env.OPENAI_API_BASE_URL, // Optional, for custom endpoints
            });
            this.client = new OpenAIApi(configuration);
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        // anthropic as provider
        if (provider === 'anthropic') {
            const { Anthropic } = require('@anthropic-ai/sdk');
            this.client = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
        }   else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        // Gemini as provider
        if (provider === 'gemini') {
            const { Gemini } = require('gemini-sdk');
            this.client = new Gemini({
                apiKey: process.env.GEMINI_API_KEY,
            });
        }   else {
            throw new Error(`Unsupported provider: ${provider}`);
        }   
        // Add more providers as needed
    }

    async generate(prompt, options = {}) {
        if (this.provider === 'openai') {
            const response = await this.client.createChatCompletion({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                ...options,
            });
            return response.data.choices[0].message.content;
        } else {
            throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }
}

module.exports = Model;