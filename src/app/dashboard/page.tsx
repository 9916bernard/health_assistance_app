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
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/signin');
    } else {
      setAuthorized(true);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('Location error:', err);
          setUserLocation(null);
        }
      );
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/signin');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const username = localStorage.getItem('userEmail');
    if (!username) {
      setResponse('Error: No username found.');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username }),
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

  const handleFindHospitals = async () => {
    if (!prompt.trim()) return;
    if (!userLocation) {
      setResponse('Please allow location access to find hospitals.');
      return;
    }

    setLoadingHospitals(true);
    setHospitals([]);

    try {
      const res = await fetch('/api/nearbyHospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          symptom: prompt,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setResponse(data.error);
      } else {
        setHospitals(data.hospitals || []);
        setResponse(`Hospitals near you (${data.userAddress}):`);
      }
    } catch (err) {
      console.error('Hospital fetch error:', err);
      setResponse('Error fetching hospital info.');
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleLoadHistory = async () => {
    const username = localStorage.getItem('userEmail');
    if (!username) return;

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setHistory(data.messages || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleDeleteOne = async (id: string) => {
    const username = localStorage.getItem('userEmail');
    if (!username) return;

    const confirmDelete = window.confirm('Delete this message?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
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
    const username = localStorage.getItem('userEmail');
    if (!username) return;

    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setHistory([]);
        alert(`Deleted ${data.deletedCount} entries.`);
      } else {
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
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Health Assistant</h1>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition">
            <LogOut size={24} />
          </button>
        </header>

        <div className="flex space-x-2 mb-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
              activeTab === 'chat'
                ? 'bg-white border-x border-t border-gray-300 text-blue-600 font-semibold'
                : 'bg-gray-100 text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquareText size={18} /> Chat
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
              activeTab === 'history'
                ? 'bg-white border-x border-t border-gray-300 text-blue-600 font-semibold'
                : 'bg-gray-100 text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => {
              handleLoadHistory();
              setActiveTab('history');
            }}
          >
            <Clock size={18} /> History
          </button>
        </div>

        <motion.div
          layout
          transition={{ duration: 0.4, type: 'spring' }}
          className="bg-white shadow-lg rounded-b-2xl rounded-tr-2xl p-6 border border-gray-200"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
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
                  {loading ? 'Analyzing...' : 'Get Health Report'}
                </button>

                <button
                  className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
                  onClick={handleFindHospitals}
                  disabled={loadingHospitals}
                >
                  {loadingHospitals ? 'Searching...' : 'Find Nearby Hospitals'}
                </button>

                <div className="mt-4">
                  <h2 className="font-medium text-gray-700 mb-1">Response:</h2>
                  <div className="p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap min-h-[80px]">
                    {loading || loadingHospitals
                      ? 'Processing...'
                      : response || 'No response yet.'}
                  </div>
                </div>

                {hospitals.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-green-700 mb-2">Nearby Hospitals:</h2>
                    <ul className="space-y-4">
                      {hospitals.map((h: any) => (
                        <li
                          key={h.place_id}
                          className="p-4 bg-green-50 border border-green-200 rounded-md"
                        >
                          <h3 className="text-sm font-bold text-green-700">{h.name}</h3>
                          <p className="text-sm text-gray-600">{h.address}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && showHistory && history.length > 0 && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-medium text-gray-700 mb-1">Chat History:</h2>
                <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                  {history.map((msg) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
