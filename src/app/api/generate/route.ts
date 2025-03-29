// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

<<<<<<< HEAD
    const response = await fetch(
=======
    const geminiRes = await fetch(
>>>>>>> 6ba7dc6 (DB connection)
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
<<<<<<< HEAD
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
=======
          contents: [{ parts: [{ text: prompt }] }],
>>>>>>> 6ba7dc6 (DB connection)
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Gemini API Error", details: err }, { status: 500 });
    }

<<<<<<< HEAD
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";

=======
    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";

    // ✅ Store to MongoDB
    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("chats");

    await collection.insertOne({
      prompt,
      response: text,
      timestamp: new Date(),
    });

>>>>>>> 6ba7dc6 (DB connection)
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
