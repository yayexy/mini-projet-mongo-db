import { MongoClient } from "mongodb";

// Source - https://stackoverflow.com/a/79875907
// Posted by Sudarsan Sarkar, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-22, License - CC BY-SA 4.0

import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "1.0.0.1"]);

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

client = new MongoClient(uri, options);
clientPromise = client.connect();

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;