'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, MessageSquareText, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'history'>('response');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/signin');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/signin');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.text || 'No response received.');
    } catch (err) {
      console.error('Client error:', err);
      setResponse('Error generating response.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!showHistory) {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        setHistory(data.messages || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    } else {
      setHistory([]);
    }

    setShowHistory(!showHistory);
    setActiveTab('history');
  };

  const handleDeleteOne = async (id: string) => {
    const confirmDelete = window.confirm('Delete this message?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setHistory((prev) => prev.filter((msg) => msg._id !== id));
      } else {
        alert('Failed to delete this message.');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Error deleting message.');
    }
  };

  const handleDeleteHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setHistory([]);
        alert(`Deleted ${data.deletedCount} entries.`);
      } else {
        console.error('Failed to delete:', data);
        alert('Failed to delete history.');
      }
    } catch (err) {
      console.error('Error deleting history:', err);
      alert('Something went wrong.');
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-100 p-4 md:p-10">
      <div className="max-w-2xl mx-auto relative">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gemini Prompt</h1>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition">
            <LogOut size={24} />
          </button>
        </header>

        <motion.div
          layout
          transition={{ duration: 0.4, type: 'spring' }}
          className="bg-white shadow-lg rounded-2xl p-6 border border-gray-200"
        >
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
            {loading ? 'Loading...' : 'Submit'}
          </button>

          <div className="mt-4 flex space-x-2">
            <button
              className={`flex-1 py-2 rounded ${
                activeTab === 'response'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('response')}
            >
              <MessageSquareText className="inline-block mr-1" size={16} /> Response
            </button>
            <button
              className={`flex-1 py-2 rounded ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={handleLoadHistory}
            >
              <Clock className="inline-block mr-1" size={16} /> History
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'response' && (
              <motion.div
                key="response"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <h2 className="font-medium text-gray-700 mb-1">Response:</h2>
                <div className="p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap min-h-[80px]">
                  {loading ? 'Thinking...' : response || 'No response yet.'}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && showHistory && history.length > 0 && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <h2 className="font-medium text-gray-700 mb-1">Chat History:</h2>
                <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                  {history.map((msg) => (
                    <div
                      key={msg._id}
                      className="p-4 border rounded bg-gray-50 space-y-1"
                    >
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
