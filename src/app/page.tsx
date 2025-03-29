"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
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
      setResponse(data.text || "No response received.");
    } catch (err) {
      console.error("Client error:", err);
      setResponse("Error generating response.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.messages || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow border border-gray-200">
        <h1 className="text-xl font-semibold text-center mb-4">Gemini Prompt UI</h1>

        <textarea
          className="w-full p-3 border rounded text-black mb-3 focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Type your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Loading..." : "Submit"}
        
        </button>

        <div className="mt-4">
          <h2 className="font-medium text-gray-700 mb-1">Response:</h2>
          <div className="p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
            {loading ? "Thinking..." : response || "No response yet."}
          </div>
        </div>
        <button
          onClick={handleLoadHistory}
          className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
        >
          Load Chat History
        </button>

        {history.length > 0 && (
          <div className="mt-4">
            <h2 className="font-medium text-gray-700 mb-1">History:</h2>
            <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
              {history.map((msg, idx) => (
                <div key={idx} className="p-2 border rounded bg-gray-50">
                  <p><strong>User:</strong> {msg.prompt}</p>
                  <p><strong>Gemini:</strong> {msg.response}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}