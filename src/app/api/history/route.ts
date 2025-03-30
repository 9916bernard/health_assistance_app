// src/app/api/history/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
    try {
      const { username } = await req.json();
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
  
      const client = await clientPromise;
      const db = client.db("health-assistant");
      const collection = db.collection("health-data");
  
      const messages = await collection
        .find({ username })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
  
      return NextResponse.json({ messages });
    } catch (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
  }
  

export async function DELETE(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("health-data");

    const result = await collection.deleteMany({ username });

    return NextResponse.json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
