// "use client";

// import { useState } from "react";

// export default function Home() {
//   const [prompt, setPrompt] = useState("");
//   const [response, setResponse] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [mode, setMode] = useState<"easy" | "expert">("easy");

//   const handleGenerate = async () => {
//     if (!prompt.trim()) return;
//     setLoading(true);
//     setResponse("");

//     try {
//       const res = await fetch("/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt, mode }),
//       });

//       const data = await res.json();
//       console.log("data:", data);
//       setResponse(data.text || "No response received.");
//     } catch (err) {
//       console.error("Client error:", err);
//       setResponse("Error generating response.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-6">
//       <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
//         <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
//           🩺 Health Support Assistant
//         </h1>

//         <div className="mb-4 flex justify-between items-center">
//           <span className="text-sm font-medium text-gray-700">
//             Vocabulary Level:
//           </span>
//           <div className="flex gap-2">
//             <button
//               onClick={() => setMode("easy")}
//               className={`px-4 py-1 rounded-full text-sm border transition ${
//                 mode === "easy"
//                   ? "bg-blue-600 text-white border-blue-600"
//                   : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
//               }`}
//             >
//               Easy
//             </button>
//             <button
//               onClick={() => setMode("expert")}
//               className={`px-4 py-1 rounded-full text-sm border transition ${
//                 mode === "expert"
//                   ? "bg-blue-600 text-white border-blue-600"
//                   : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
//               }`}
//             >
//               Expert
//             </button>
//           </div>
//         </div>

//         <label
//           htmlFor="symptom"
//           className="block mb-2 font-medium text-gray-800"
//         >
//           Describe your symptoms:
//         </label>
//         <textarea
//           id="symptom"
//           className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
//           placeholder="e.g., I have a sore throat and mild fever..."
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//           rows={5}
//         />

//         <button
//           className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
//           onClick={handleGenerate}
//           disabled={loading}
//         >
//           {loading ? "Analyzing..." : "Get Health Report"}
//         </button>

//         <div className="mt-6">
//           <h2 className="text-lg font-semibold text-blue-700 mb-2">
//             Response:
//           </h2>
//           <div className="whitespace-pre-wrap bg-blue-50 text-gray-900 p-4 rounded-md border border-blue-200 text-sm leading-relaxed">
//             {loading ? "Thinking..." : response || "No response yet."}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [mode, setMode] = useState<"easy" | "expert">("easy");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ✅ Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching location:", error);
          setUserLocation(null);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  // ✅ Handle generating a health report
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
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

  // ✅ Handle finding nearby hospitals based on user location and symptoms
  const handleFindHospitals = async () => {
    if (!prompt.trim()) return;
    if (!userLocation) {
      setResponse(
        "Unable to get your location. Please enable location services."
      );
      return;
    }
    setLoadingHospitals(true);
    setHospitals([]);

    try {
      const { latitude, longitude } = userLocation;

      const res = await fetch("/api/nearbyHospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, symptom: prompt }),
      });

      const data = await res.json();
      if (data.error) {
        setHospitals([]);
        setResponse(data.error);
      } else {
        setHospitals(data.hospitals || []);
        setResponse(`Hospitals found near: ${data.userAddress}`);
      }
    } catch (err) {
      console.error("Error finding hospitals:", err);
      setResponse("Error fetching hospitals.");
    } finally {
      setLoadingHospitals(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-6">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          🩺 Health Support Assistant
        </h1>

        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Vocabulary Level:
          </span>
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

        <label
          htmlFor="symptom"
          className="block mb-2 font-medium text-gray-800"
        >
          Describe your symptoms:
        </label>
        <textarea
          id="symptom"
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          placeholder="e.g., I have a sore throat and mild fever..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
        />

        {/* ✅ Button to get health report */}
        <button
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Get Health Report"}
        </button>

        {/* ✅ Button to find nearby hospitals */}
        <button
          className="w-full mt-4 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition disabled:opacity-60"
          onClick={handleFindHospitals}
          disabled={loadingHospitals}
        >
          {loadingHospitals ? "Searching..." : "Find Nearby Hospitals"}
        </button>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">
            Response:
          </h2>
          <div className="whitespace-pre-wrap bg-blue-50 text-gray-900 p-4 rounded-md border border-blue-200 text-sm leading-relaxed">
            {loading || loadingHospitals
              ? "Processing..."
              : response || "No response yet."}
          </div>

          {/* ✅ Display nearby hospitals */}
          {hospitals.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-green-700 mb-2">
                Nearby Hospitals:
              </h2>
              <ul className="space-y-4">
                {hospitals.map((hospital: any) => (
                  <li
                    key={hospital.place_id}
                    className="p-4 bg-green-50 border border-green-200 rounded-md"
                  >
                    <h3 className="text-sm font-bold text-green-700">
                      {hospital.name}
                    </h3>
                    <p className="text-sm text-gray-600">{hospital.address}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
