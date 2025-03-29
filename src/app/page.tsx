"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      console.log("data:", data);
      setResponse(data.text || "No response received.");
    } catch (err) {
      console.error("Client error:", err);
      setResponse("Error generating response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow border border-gray-200">
        <h1 className="text-xl font-semibold text-center mb-4">
          🩺 Health Assistant
        </h1>

        <textarea
          className="w-full p-3 border rounded text-black mb-3 focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Describe your symptoms..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Submit"}
        </button>

        <div className="mt-4">
          <h2 className="font-medium text-gray-700 mb-1">Response:</h2>
          <div className="p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
            {loading ? "Thinking..." : response || "No response yet."}
          </div>
        </div>
      </div>
    </div>
  );
}
