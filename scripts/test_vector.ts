import OpenAI from "openai";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "epstein_rag";
const apiKey = process.env.OPENAI_API_KEY!;
const openai = new OpenAI({ apiKey });

const query = process.argv.slice(2).join(" ") || "palm beach house russian buyer";

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db(dbName);

const count = await db.collection("chunks").estimatedDocumentCount();
console.log("chunksCount:", count);

const emb = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: query,
});

const queryVector = emb.data[0].embedding;

const hits = await db.collection("chunks").aggregate([
  {
    $vectorSearch: {
      index: "epstein_vector_index",
      path: "embedding",
      queryVector,
      numCandidates: 200,
      limit: 5,
    },
  },
  {
    $project: {
      _id: 0,
      chunkKey: 1,
      threadKey: 1,
      score: { $meta: "vectorSearchScore" },
      text: 1,
    },
  },
]).toArray();

console.log("hits:", hits.length);
console.log(hits);
await client.close();
