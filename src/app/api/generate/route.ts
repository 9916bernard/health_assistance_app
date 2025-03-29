import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPTS = {
  easy: `You are a friendly health assistant. Your job is to explain possible health issues in a very simple and easy way, using words that a child or someone without any medical knowledge can understand. 
Do not use medical or scientific terms. If you must mention them, always explain them in plain English.

Always respond using this JSON format:
{
  "most_likely_condition": "...",
  "best_case_scenario": "...",
  "worst_case_scenario": "...",
  "what_you_can_do_now": "...",
  "recommended_clinic": "...",
  "otc_medication": "...",
  "urgency_score": 5
}

If the user types something that isn't a symptom, reply with:
{
  "most_likely_condition": "N/A",
  "best_case_scenario": "N/A",
  "worst_case_scenario": "N/A",
  "what_you_can_do_now": "N/A",
  "recommended_clinic": "N/A",
  "otc_medication": "N/A",
  "urgency_score": 1,
  "note": "I am a health support assistant. Please describe any symptoms you're experiencing."
}`,

  expert: `You are a professional medical assistant. Use precise medical terminology to explain potential conditions and treatments.

Respond using this JSON format:
{
  "most_likely_condition": "...",
  "best_case_scenario": "...",
  "worst_case_scenario": "...",
  "what_you_can_do_now": "...",
  "recommended_clinic": "...",
  "otc_medication": "...",
  "urgency_score": 5
}

If the input is not a symptom, reply with:
{
  "most_likely_condition": "N/A",
  "best_case_scenario": "N/A",
  "worst_case_scenario": "N/A",
  "what_you_can_do_now": "N/A",
  "recommended_clinic": "N/A",
  "otc_medication": "N/A",
  "urgency_score": 1,
  "note": "I am a health support assistant. Please describe any symptoms you're experiencing."
}`
};

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const systemPrompt = PROMPTS[mode === "expert" ? "expert" : "easy"];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }]
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
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 전처리: ```json 블록 제거
    const clean = raw.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (e) {
      console.error("Failed to parse:", clean);
      return NextResponse.json({ error: "Failed to parse Gemini response." }, { status: 500 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
