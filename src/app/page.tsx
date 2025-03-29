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
      setResponse(data.text);
    } catch (err) {
      setResponse("Error generating response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 border rounded bg-gray-50">
      <h1 className="text-xl font-semibold mb-4 text-center">AI Prompt Interface</h1>

      <textarea
        className="w-full p-2 border rounded mb-3 text-black"
        placeholder="Type your prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />

      <button
        className="w-full bg-gray-800 text-white py-2 rounded disabled:opacity-60"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Loading..." : "Submit"}
      </button>

      <div className="mt-4">
        <h2 className="text-base font-medium mb-1">Response:</h2>
        <div className="p-3 border rounded text-sm bg-white">
          {response || "No response yet."}
        </div>
      </div>
    </div>
  );
}
