"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const handleDeleteOne = async (id: string) => {
    const confirmDelete = window.confirm("Delete this message?");
    if (!confirmDelete) return;
  
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const data = await res.json();
  
      if (res.ok && data.success) {
        setHistory((prev) => prev.filter((msg) => msg._id !== id));
      } else {
        alert("Failed to delete this message.");
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Error deleting message.");
    }
  };

  const handleDeleteHistory = async () => {
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      const data = await res.json();
  
      if (res.ok) {
        setHistory([]); // Clear local state too
        alert(`Deleted ${data.deletedCount} entries.`);
      } else {
        console.error("Failed to delete:", data);
        alert("Failed to delete history.");
      }
    } catch (err) {
      console.error("Error deleting history:", err);
      alert("Something went wrong.");
    }
  };
  
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
    if (!showHistory) {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data.messages || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    } else {
      // When hiding, clear history from state
      setHistory([]);
    }
  
    setShowHistory(!showHistory); // toggle visibility
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
          {showHistory ? "Hide Chat History" : "Load Chat History"}
        </button>

        {showHistory && history.length > 0 && (
          <div className="mt-4">
            <h2 className="font-medium text-gray-700 mb-1">Chat History:</h2>
            <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
              {history.map((msg, idx) => (
                <div key={msg._id} className="p-4 border rounded bg-gray-50 space-y-1">
                  <p><strong>User:</strong> {msg.prompt}</p>
                  <p><strong>Gemini:</strong> {msg.response}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleDeleteOne(msg._id)}
                    className="mt-2 inline-block bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    🗑️ Delete This Message
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleDeleteHistory}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
            >
              🗑️ Delete All Chat History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}