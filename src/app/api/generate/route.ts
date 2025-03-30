// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { categorizeQuestion } from "@/lib/categorize";

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
    const { prompt, fdaQuery } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser input: ${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );
    const category = categorizeQuestion(prompt);


    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "Gemini API Error", details: err },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";

    let fdaData = null;
    if (fdaQuery && typeof fdaQuery === "string") {
      try {
        const fdaRes = await fetch(`https://api.fda.gov/${fdaQuery}`);
        if (fdaRes.ok) {
          fdaData = await fdaRes.json();
        } else {
          const err = await fdaRes.json();
          console.error("openFDA API error:", err);
          fdaData = { error: "openFDA API Error", details: err };
        }
      } catch (fdaErr) {
        console.error("openFDA fetch error:", fdaErr);
        fdaData = { error: "Failed to fetch openFDA data" };
      }
    }

    // ✅ MongoDB에 저장
    const client = await clientPromise;
    // select collection named after the category
    const db = client.db("health-assistant");
    const collection = db.collection(category); // e.g., "Orthopedics", "General"

    await collection.insertOne({
      prompt,
      response: text,
      timestamp: new Date(),
      category, // optional but nice to keep
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
