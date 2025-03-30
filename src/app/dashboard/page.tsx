'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      if (line.startsWith("Urgency Score")) {
        parsed.urgencyScore = line.split(":")[1]?.trim() || '';
      } else if (line.startsWith("Most Likely Condition")) {
        parsed.mostLikelyCondition = line.split(":")[1]?.trim() || '';
      } else if (line.startsWith("Recommended Clinic")) {
        parsed.recommendedClinic = line.split(":")[1]?.trim() || '';
      } else if (line.startsWith("Recommanded Medication")) {
        parsed.recommendedMedication = line.split(":")[1]?.trim() || '';
      } else if (line.startsWith("What You Can Do Now")) {
        parsed.whatYouCanDoNow = line.split(":")[1]?.trim() || '';
      }
    });
    return parsed;
  };

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
        body: JSON.stringify({ prompt, username }),
      });
      const data = await res.json();
      let fullText = data.text || 'No response received.';
      let mainText = fullText;
      let fdaInfo = '';
      const marker = "💊 Drug Info";
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

  // "Find Nearby Hospitals" 버튼은 지도 표시를 위해 토글합니다.
  const handleShowClinicMap = () => {
    handleFindHospitals();
    setClinicMapVisible((prev) => !prev);
  };

  // Medication Details 버튼 클릭 시 openFDA 정보 토글
  const handleMedicationDetail = () => {
    setMedicationDetailVisible((prev) => !prev);
  };

  if (!authorized || !isLoaded) return null;

  // Urgency Score 항상 숫자가 표시되도록 기본값 처리
  const urgencyValue = parseInt(parsedResponse.urgencyScore) || 0;
  const urgencyBarWidth = `${(urgencyValue / 10) * 100}%`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto relative">
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
                  placeholder="Describe your symptoms as specific as possible..."
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

                {rawResponse && !loading && !loadingHospitals && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. 응급 점수 */}
                    <div className="bg-white shadow p-4 rounded">
                      <h2 className="text-lg font-semibold mb-2">Urgency Score</h2>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-red-500 h-4 rounded-full" style={{ width: urgencyBarWidth }}></div>
                        </div>
                        <span className="ml-2 text-sm font-semibold text-gray-700">
                          {urgencyValue}/10
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Monitor your symptoms and seek advice if you notice any changes.
                      </p>
                    </div>

                    {/* 2. Most Likely Condition */}
                    <div className="bg-white shadow p-4 rounded flex flex-col items-center justify-center">
                      <h2 className="text-lg font-semibold">Most Likely Condition</h2>
                      <p className="text-2xl font-bold mt-2">{parsedResponse.mostLikelyCondition}</p>
                    </div>

                    {/* 3. What You Can Do Now (전체 가로 사용) */}
                    <div className="bg-white shadow p-4 rounded col-span-1 md:col-span-2">
                      <h2 className="text-lg font-semibold mb-2">What You Can Do Now</h2>
                      <p>{parsedResponse.whatYouCanDoNow}</p>
                    </div>

                    {/* 4. Clinics & Hospitals */}
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
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
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

                    {/* 5. Medication Recommendation */}
                    <div className="bg-white shadow p-4 rounded">
                      <h2 className="text-lg font-semibold mb-2">Medication Recommendation</h2>
                      <p className="mt-2">{parsedResponse.recommendedMedication}</p>
                      <button
                        onClick={handleMedicationDetail}
                        className="mt-2 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
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
