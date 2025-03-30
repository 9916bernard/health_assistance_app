// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { categorizeQuestion } from "@/lib/categorize";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are a friendly health assistant. Your job is to explain possible health issues in a simple and general way for non-medical users. Always use easy-to-understand and general language.

Always respond using this format:

Urgency Score (1–10): <number only>
Most Likely Condition: ...
Recommended Clinic: ...
Recommanded Medication: <Comma-separated list of real medicine brand names only, no descriptions>
What You Can Do Now: ...

If the user types something unrelated to symptoms, reply:
"I am a health support assistant. Please tell me about any pain or symptoms you're feeling, and I will try to help."
`;

export async function POST(req: Request) {
  try {
    
    const body = await req.json();
    const { prompt, username , useHistoryContext } = body;
    console.log("Incoming request:", { prompt, username });

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    let historyContext = '';
    if (useHistoryContext) {
      const client = await clientPromise;
      const db = client.db('health-assistant');
      const collection = db.collection('health-data');

      const past = await collection
        .find({ username })
        .sort({ timestamp: -1 })
        .limit(3) // 최근 3개만 사용
        .toArray();

      if (past.length > 0) {
        historyContext = past
          .map(
            (p, idx) =>
              `Previous Diagnosis ${idx + 1}:\n- Symptoms: ${p.prompt}\n- Diagnosis: ${p.response}`
          )
          .join('\n\n');
      }
    }
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${
      historyContext ? historyContext + '\n\n' : ''
    }User input: ${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      }
    );

    const category = categorizeQuestion(prompt);

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Gemini API error", details: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";

    // OTC Medication 이름 추출
    const otcMatch = text.match(/Recommanded Medication:\s*(.+)/i);
    const otcName = otcMatch?.[1]?.split(",")[0].trim();

    let fdaInfo = "";
    if (otcName) {
      try {
        const fdaRes = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(otcName)}"`
        );
        if (fdaRes.ok) {
          const fdaJson = await fdaRes.json();
          const firstResult = fdaJson.results?.[0];
          const usage =
            firstResult?.description?.[0] ||
            firstResult?.indications_and_usage?.[0] ||
            "No usage info found.";
          const warnings = firstResult?.warnings?.[0] || "No warnings info found.";
          fdaInfo = `\n\n💊 Drug Info (from openFDA for ${otcName}):\n\nUsage: ${usage}\n\nWarnings: ${warnings}\n`;
        } else {
          const err = await fdaRes.json();
          console.error("openFDA API error:", err);
        }
      } catch (fdaErr) {
        console.error("openFDA fetch error:", fdaErr);
      }
    }
    function extractFieldsFromText(text: string) {
      const lines = text.split("\n").map((line) => line.trim());
      let urgencyScore = "";
      let mostLikelyCondition = "";
    
      for (const line of lines) {
        if (line.startsWith("Urgency Score")) {
          urgencyScore = line.split(":")[1]?.trim() || "";
        }
        if (line.startsWith("Most Likely Condition")) {
          mostLikelyCondition = line.split(":")[1]?.trim() || "";
        }
      }
    
      return { urgencyScore, mostLikelyCondition };
    }

    const { urgencyScore, mostLikelyCondition } = extractFieldsFromText(text);

    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("health-data");

    await collection.insertOne({
      username,
      prompt,
      response: text,
      timestamp: new Date(),
      category,
      urgencyScore,
      mostLikelyCondition,
    });

    return NextResponse.json({ text: text + fdaInfo });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
