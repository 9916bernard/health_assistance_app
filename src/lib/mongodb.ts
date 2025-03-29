import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// Caching client across hot reloads (for dev)
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // allow global `var` cache in dev
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise!;

export default clientPromise;
