// src/app/api/history/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("chats");

    const messages = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("chats");

    const result = await collection.deleteMany({}); // 🔥 delete all documents

    return NextResponse.json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
