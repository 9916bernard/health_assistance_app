// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are a friendly health assistant. Your job is to explain possible health issues in a simple, understandable way for non-medical users.

Always respond using this format:

Urgency Score (1–10): ...
Most Likely Condition: ...
What You Can Do Now: ...
Recommended Clinic: ...
OTC Medication: ...
Best Case Scenario: ...
Worst Case Scenario: ...

If the user types something unrelated to symptoms, reply:
"I am a health support assistant. Please tell me about any pain or symptoms you're feeling, and I will try to help."
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // ✅ 시스템 프롬프트와 유저 프롬프트를 합치기
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser input: ${prompt}`;

    // ✅ Gemini API 요청
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Gemini API Error", details: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";

    // ✅ MongoDB에 저장
    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("chats");

    await collection.insertOne({
      prompt,
      response: text,
      timestamp: new Date(),
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
