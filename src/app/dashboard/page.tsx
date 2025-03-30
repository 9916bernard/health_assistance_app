'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import symtomsenseLogo from '/public/symtomsense.png';
import { LogOut, MessageSquareText, Clock } from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';

// Map container styles
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Default center location if geolocation fails
const defaultCenter = {
  lat: 40.748817, // New York City
  lng: -73.985428,
};

export default function Dashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [useHistoryContext, setUseHistoryContext] = useState(false);
  const [parsedResponse, setParsedResponse] = useState({
    urgencyScore: '',
    mostLikelyCondition: '',
    recommendedClinic: '',
    recommendedMedication: '',
    whatYouCanDoNow: '',
  });
  const [medicationFdaInfo, setMedicationFdaInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  // 지도/병원 정보 및 medication detail 표시 여부
  const [clinicMapVisible, setClinicMapVisible] = useState(false);
  const [medicationDetailVisible, setMedicationDetailVisible] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
      router.replace('/signin'); // 로그인 안 되어 있으면 signin 페이지로 이동
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

  const parseResponse = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const parsed = {
      urgencyScore: '',
      mostLikelyCondition: '',
      recommendedClinic: '',
      recommendedMedication: '',
      whatYouCanDoNow: '',
    };
    lines.forEach((line) => {
      if (line.startsWith('Urgency Score')) {
        parsed.urgencyScore = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('Most Likely Condition')) {
        parsed.mostLikelyCondition = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('Recommended Clinic')) {
        parsed.recommendedClinic = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('Recommanded Medication')) {
        parsed.recommendedMedication = line.split(':')[1]?.trim() || '';
      } else if (line.startsWith('What You Can Do Now')) {
        parsed.whatYouCanDoNow = line.split(':')[1]?.trim() || '';
      }
    });
    return parsed;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    router.push('/signin');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const username = localStorage.getItem('userEmail');
    if (!username) {
      setRawResponse('Error: No username found.');
      return;
    }

    setLoading(true);
    setRawResponse('');
    setMedicationFdaInfo('');
    setParsedResponse({
      urgencyScore: '',
      mostLikelyCondition: '',
      recommendedClinic: '',
      recommendedMedication: '',
      whatYouCanDoNow: '',
    });
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username, useHistoryContext }),
      });
      const data = await res.json();
      const fullText = data.text || 'No response received.';
      let mainText = fullText;
      let fdaInfo = '';
      const marker = '💊 Drug Info';
      if (fullText.includes(marker)) {
        const parts = fullText.split(marker);
        mainText = parts[0].trim();
        fdaInfo = marker + parts[1].trim();
      }
      setRawResponse(mainText);
      setMedicationFdaInfo(fdaInfo);
      setParsedResponse(parseResponse(mainText));
    } catch (err) {
      console.error('Client error:', err);
      setRawResponse('Error generating response.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindHospitals = async () => {
    if (!prompt.trim()) return;
    if (!userLocation) {
      setRawResponse('Please allow location access to find hospitals.');
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
        setRawResponse(data.error);
      } else {
        setHospitals(data.hospitals || []);
        setRawResponse(`Hospitals near you (${data.userAddress}):`);
      }
    } catch (err) {
      console.error('Hospital fetch error:', err);
      setRawResponse('Error fetching hospital info.');
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleLoadHistory = async () => {
    const username = localStorage.getItem('userEmail');
    if (!username) {
      alert("You're not logged in.");
      return;
    }
  
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

  const handleShowClinicMap = () => {
    handleFindHospitals();
    setClinicMapVisible((prev) => !prev);
  };

  const handleMedicationDetail = () => {
    setMedicationDetailVisible((prev) => !prev);
  };

  if (!authorized || !isLoaded) return null;

  const urgencyValue = parseInt(parsedResponse.urgencyScore) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto relative">

        {/* 헤더 영역: 이미지 + 제목 + 오른쪽 위 로그아웃 아이콘 */}
        <header className="relative flex flex-col items-center mb-6 px-6 py-6">
          <div className="absolute top-45 right-0">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  handleLogout();
                }
              }}
              className="p-2 text-gray-600 hover:text-red-500"
            >
              <LogOut size={24} />
            </button>
          </div>
          <Image
            src={symtomsenseLogo}
            alt="Symptom Sense"
            width={470}
            height={470}
            className="mb-2"
          />
        </header>

        <div className="flex justify-between items-end -mb-px px-6">
          <div className="flex items-end space-x-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
                activeTab === 'chat'
                  ? 'bg-white border-x border-t border-gray-300 text-green-600 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:text-green-500'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquareText size={18} /> Chat
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
                activeTab === 'history'
                  ? 'bg-white border-x border-t border-gray-300 text-green-600 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:text-green-500'
              }`}
              onClick={() => {
                handleLoadHistory();
                setActiveTab('history');
              }}
            >
              <Clock size={18} /> History
            </button>
          </div>

          <div className="flex flex-col items-end gap-3 px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Include Past Symptom</span>
              <button
                onClick={() => setUseHistoryContext(!useHistoryContext)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                  useHistoryContext ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    useHistoryContext ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        <motion.div
          layout
          transition={{ duration: 0.4, type: 'spring' }}
          className="bg-white shadow-lg rounded-b-2xl rounded-tr-2xl p-6 border border-gray-200 mt-4"
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
                  placeholder="Describe your symptoms!"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                <button
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Get Health Report'}
                </button>

                {rawResponse && !loading && !loadingHospitals && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white shadow p-4 rounded col-span-1 md:col-span-2">
                      <h2 className="text-lg font-semibold mb-4">Urgency Score</h2>
                      <div className="flex flex-col items-center justify-center">
                        <svg width="200" height="100" viewBox="0 0 200 100">
                          <defs>
                            <linearGradient id="urgencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#facc15" />
                              <stop offset="50%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M10,100 A90,90 0 0,1 190,100"
                            fill="none"
                            stroke="url(#urgencyGradient)"
                            strokeWidth="20"
                          />
                          <line
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="20"
                            stroke="black"
                            strokeWidth="2"
                            transform={`rotate(${(urgencyValue - 5) * 18} 100 100)`}
                          />
                          <circle
                            cx="100"
                            cy="100"
                            r="5"
                            fill="black"
                            transform={`rotate(${(urgencyValue - 1) * 18} 100 100)`}
                          />
                        </svg>
                        <span className="mt-2 text-xl font-bold text-gray-800">{urgencyValue}/10</span>
                        <p className="text-sm mt-1 text-black-600">
                          {urgencyValue <= 3
                            ? 'You are fine!'
                            : urgencyValue <= 7
                            ? 'Warning!'
                            : 'Dangerous!'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white shadow p-4 rounded col-span-1 md:col-span-2">
                      <h2 className="text-lg font-semibold">Most Likely Condition</h2>
                      <p className="text-2xl font-bold mt-2 text-center">{parsedResponse.mostLikelyCondition}</p>
                    </div>

                    {/* What You Can Do Now */}
                    <div className="bg-white shadow p-4 rounded col-span-1 md:col-span-2">
                      <h2 className="text-lg font-semibold mb-2">What You Can Do Now</h2>
                      <p>{parsedResponse.whatYouCanDoNow}</p>
                    </div>

                    {/* Clinics & Hospitals */}
                    <div className="bg-white shadow p-4 rounded">
                      <h2 className="text-lg font-semibold mb-2">Clinics &amp; Hospitals</h2>
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Recommended Clinic:</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {parsedResponse.recommendedClinic || 'No clinic recommendation provided.'}
                        </p>
                      </div>
                      <button
                        onClick={handleShowClinicMap}
                        className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition"
                      >
                        Find Nearby Hospitals
                      </button>
                      {clinicMapVisible && (
                        <div className="mt-4">
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={14}
                            center={
                              userLocation
                                ? { lat: userLocation.latitude, lng: userLocation.longitude }
                                : defaultCenter
                            }
                          >
                            {userLocation && (
                              <Marker
                                position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                                label="You"
                              />
                            )}
                            {hospitals.map((h: any) => (
                              <Marker
                                key={h.place_id}
                                position={{ lat: h.location.lat, lng: h.location.lng }}
                                title={h.name}
                              />
                            ))}
                          </GoogleMap>
                          {hospitals.length > 0 && (
                            <ul className="mt-2 space-y-2">
                              {hospitals.map((h: any) => (
                                <li key={h.place_id} className="p-2 bg-green-50 border border-green-200 rounded">
                                  <h3 className="text-sm font-bold text-green-700">{h.name}</h3>
                                  <p className="text-sm text-gray-600">{h.address}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Medication Recommendation */}
                    <div className="bg-white shadow p-4 rounded">
                      <h2 className="text-lg font-semibold mb-2">Medication Recommendation</h2>
                      <p className="mt-2">{parsedResponse.recommendedMedication}</p>
                      <button
                        onClick={handleMedicationDetail}
                        className="mt-2 w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition"
                      >
                        Medication Details
                      </button>
                      {medicationDetailVisible && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {medicationFdaInfo || 'No medication details available.'}
                          </p>
                        </div>
                      )}
                    </div>
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
                      <p>
                        <strong>User:</strong> {msg.prompt}
                      </p>
                      <p>
                        <strong>Gemini:</strong> {msg.response}
                      </p>
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
