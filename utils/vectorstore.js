/*
This is the vectorstore utility module. It provides functions to create and manage a vector store for text embeddings.
In a standard Afropair pipeline, this is usually used after the dictionary lookup and translation steps to store and retrieve text embeddings for various NLP tasks.
It is designed to work with a simple in-memory vector store, but can be extended to use more sophisticated storage solutions like Pinecone, FAISS, or others.
The vector store can be used to add, search, and manage text embeddings efficiently.
Example usage:
const vectorStore = new VectorStore();
await vectorStore.add('Bonjour', [0.1, 0.2, 0.3]);
const results = await vectorStore.search([0.1, 0.2, 0.3], 5);
console.log(results); // Outputs: top 5 closest vectors
*/
class VectorStore {
    constructor(type = 'pgvector') {

        // if pgvector as type
        if (type === 'pgvector') {
            const { Client } = require('pg');
            this.client = new Client({
                connectionString: process.env.DATABASE_URL,
            });
            this.client.connect();
            // Ensure the table exists
            this.client.query(`
                CREATE TABLE IF NOT EXISTS vectors (
                    id SERIAL PRIMARY KEY,
                    src TEXT,
                    tgt TEXT,
                    embedding VECTOR(1536) -- Adjust dimension as needed
                );
            `);
        } 
    }
    async add(src, tgt, embedding) {
        // Add a new vector to the store
        if (this.client) {
            const query = 'INSERT INTO vectors (src, tgt, embedding) VALUES ($1, $2, $3)';
            await this.client.query(query, [src, tgt, embedding]);
        } else {
            throw new Error('Vector store client not initialized.');
        }
    }

    async search(embedding, topK = 5) {
        // Search for the top K closest vectors
        if (this.client) {
            const query = `
                SELECT src, tgt, embedding <-> $1 AS distance
                FROM vectors
                ORDER BY distance
                LIMIT $2;
            `;
            const res = await this.client.query(query, [embedding, topK]);
            return res.rows;
        } else {
            throw new Error('Vector store client not initialized.');
        }
    }

    async close() {
        // Close the database connection
        if (this.client) {
            await this.client.end();
        }
    }   
}

module.exports = VectorStore;

