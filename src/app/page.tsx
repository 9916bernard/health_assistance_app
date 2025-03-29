"use client";
import { useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function Home() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"easy" | "expert">("easy");

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const fetchHospitals = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const res = await fetch("/api/generate/nearbyHospital", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        });

        const data = await res.json();
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setHospitals(data.hospitals);
        setUserAddress(data.userAddress);
        setLoading(false);
      },
      () => {
        alert("Location access denied.");
        setLoading(false);
      }
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt.");
      return;
    }
    setLoading(true);
    setResponse("");

    try {
      const res = await axios.post("/api/generate/route", { prompt, mode });
      setResponse(res.data.text || "No response from Gemini.");
    } catch (error) {
      console.error("Error fetching response from Gemini:", error);
      setResponse("Failed to get a response from Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start p-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">🩺 Health Support Assistant</h1>

      <div className="w-full max-w-xl mb-10">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Vocabulary Level:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("easy")}
              className={`px-4 py-1 rounded-full text-sm border transition ${
                mode === "easy"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setMode("expert")}
              className={`px-4 py-1 rounded-full text-sm border transition ${
                mode === "expert"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Expert
            </button>
          </div>
        </div>

        <textarea
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          placeholder="e.g., I have a sore throat and mild fever..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
        />

        <button
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Get Health Report"}
        </button>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">Response:</h2>
          <div className="whitespace-pre-wrap bg-blue-50 text-gray-900 p-4 rounded-md border border-blue-200 text-sm leading-relaxed">
            {loading ? "Thinking..." : response || "No response yet."}
          </div>
        </div>
      </div>

      <hr className="w-full border-gray-300 mb-10" />

      <div className="w-full max-w-xl text-center">
        <button
          onClick={fetchHospitals}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Loading..." : "Find Nearby Hospitals"}
        </button>

        {userAddress && (
          <p className="mt-4 text-gray-700">📍 Your Location: {userAddress}</p>
        )}

        {isLoaded && userLocation && (
          <GoogleMap
            center={userLocation}
            zoom={13}
            mapContainerStyle={{
              width: "100%",
              height: "500px",
              marginTop: "20px",
            }}
          >
            <Marker position={userLocation} label="You" />
            {hospitals.map((h) => (
              <Marker key={h.place_id} position={h.location} label={h.name} />
            ))}
          </GoogleMap>
        )}

        {hospitals.length > 0 && (
          <div className="mt-6 w-full max-w-2xl text-left">
            <h2 className="text-xl font-semibold mb-2">Nearby Hospitals:</h2>
            <ul>
              {hospitals.map((h) => (
                <li key={h.place_id} className="mb-3">
                  <strong>{h.name}</strong>
                  <br />
                  {h.address}
                  <br />
                  <a
                    className="text-blue-500 underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${h.location.lat},${h.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Google Maps
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
