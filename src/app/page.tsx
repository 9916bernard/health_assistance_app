// "use client";

// import { useState } from "react";

// export default function Home() {
//   const [prompt, setPrompt] = useState("");
//   const [response, setResponse] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleGenerate = async () => {
//     if (!prompt.trim()) return;
//     setLoading(true);
//     setResponse("");

//     try {
//       const res = await fetch("/api/generate/route", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });

//       const data = await res.json();
//       console.log("data:", data); // ✅ 응답 구조 확인
//       setResponse(data.text || "No response received.");
//     } catch (err) {
//       console.error("Client error:", err);
//       setResponse("Error generating response.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
//       <div className="max-w-md w-full bg-white p-6 rounded-lg shadow border border-gray-200">
//         <h1 className="text-xl font-semibold text-center mb-4">
//           Gemini Prompt UI
//         </h1>

//         <textarea
//           className="w-full p-3 border rounded text-black mb-3 focus:ring-2 focus:ring-blue-500"
//           rows={4}
//           placeholder="Type your prompt..."
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//         />

//         <button
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
//           onClick={handleGenerate}
//           disabled={loading}
//         >
//           {loading ? "Loading..." : "Submit"}
//         </button>

//         <div className="mt-4">
//           <h2 className="font-medium text-gray-700 mb-1">Response:</h2>
//           <div className="p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
//             {loading ? "Thinking..." : response || "No response yet."}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";
import { useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import axios from "axios";

// ✅ Load API Key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function Home() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // For Gemini
  const [prompt, setPrompt] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // ✅ Fetch Nearby Hospitals
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

  // ✅ Fetch Response from Gemini
  const fetchGeminiResponse = async () => {
    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    try {
      const res = await axios.post("/api/generate/route", { prompt });
      setGeminiResponse(res.data.text || "No response from Gemini.");
    } catch (error) {
      console.error("Error fetching response from Gemini:", error);
      alert("Failed to get a response from Gemini.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Nearby Hospitals & Gemini AI</h1>

      <button
        onClick={fetchHospitals}
        className="bg-green-600 text-white px-6 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Find Nearby Hospitals"}
      </button>

      {userAddress && (
        <p className="mt-4 text-gray-700">Your Location: {userAddress}</p>
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
        <div className="mt-6 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Hospital List:</h2>
          <ul>
            {hospitals.map((h) => (
              <li key={h.place_id} className="mb-2">
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

      {/* Gemini API Section */}
      <div className="mt-10 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Ask Google Gemini</h2>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt for Google Gemini"
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={fetchGeminiResponse}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Get Response
        </button>

        {geminiResponse && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Gemini Response:</h3>
            <p>{geminiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}
