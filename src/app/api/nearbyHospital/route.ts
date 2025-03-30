// // import { NextResponse } from "next/server";

// // export async function POST(req: Request) {
// //   const { latitude, longitude } = await req.json();
// //   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// //   if (!apiKey) {
// //     return NextResponse.json({ error: "API key missing" }, { status: 500 });
// //   }

// //   // ✅ Google Places API URLs
// //   const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=hospital&key=${apiKey}`;
// //   const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

// //   try {
// //     // ✅ Make parallel API requests to Places API and Geocode API
// //     const [placesRes, geoRes] = await Promise.all([
// //       fetch(placesUrl),
// //       fetch(geoUrl),
// //     ]);
// //     const placesData = await placesRes.json();
// //     const geoData = await geoRes.json();

// //     if (placesData.status !== "OK") {
// //       return NextResponse.json(
// //         { error: placesData.error_message || "Google Places API error" },
// //         { status: 400 }
// //       );
// //     }

// //     // ✅ Format hospital data
// //     const hospitals = placesData.results.map((h: any) => ({
// //       name: h.name,
// //       address: h.vicinity,
// //       location: h.geometry.location,
// //       place_id: h.place_id,
// //     }));

// //     // ✅ Format user address
// //     const userAddress =
// //       geoData.results[0]?.formatted_address || "Unknown address";

// //     return NextResponse.json({ hospitals, userAddress });
// //   } catch (error) {
// //     console.error("Error fetching hospitals:", error);
// //     return NextResponse.json(
// //       { error: "Internal Server Error" },
// //       { status: 500 }
// //     );
// //   }
// // }
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   const { latitude, longitude, symptom } = await req.json();
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

//   if (!apiKey) {
//     return NextResponse.json({ error: "API key missing" }, { status: 500 });
//   }

//   // ✅ Map symptom to relevant search term for specialized hospitals
//   const symptomToSpecialtyMap: { [key: string]: string } = {
//     stomachache: "gastroenterology",
//     fever: "general hospital",
//     cardiac: "cardiology",
//     headache: "neurology",
//     cough: "pulmonology",
//     fracture: "orthopedics",
//     skin: "dermatology",
//     maternity: "maternity hospital",
//     eye: "ophthalmology",
//   };

//   // ✅ Fallback to "hospital" if no match is found
//   const searchQuery =
//     symptomToSpecialtyMap[symptom.toLowerCase()] || "hospital";

//   // ✅ Google Places API URL to search specific hospitals based on symptom
//   const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&keyword=${encodeURIComponent(
//     searchQuery
//   )}&key=${apiKey}`;

//   const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

//   try {
//     // ✅ Fetch from Google Places API and Geocoding API
//     const [placesRes, geoRes] = await Promise.all([
//       fetch(placesUrl),
//       fetch(geoUrl),
//     ]);
//     const placesData = await placesRes.json();
//     const geoData = await geoRes.json();

//     if (placesData.status !== "OK") {
//       return NextResponse.json(
//         { error: placesData.error_message || "Google Places API error" },
//         { status: 400 }
//       );
//     }

//     // ✅ Format hospital data
//     const hospitals = placesData.results.map((h: any) => ({
//       name: h.name,
//       address: h.vicinity,
//       location: h.geometry.location,
//       place_id: h.place_id,
//     }));

//     // ✅ Get user’s formatted address
//     const userAddress =
//       geoData.results[0]?.formatted_address || "Unknown address";

//     return NextResponse.json({ hospitals, userAddress });
//   } catch (error) {
//     console.error("Error fetching hospitals:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { latitude, longitude, symptom } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  // ✅ Map symptom to relevant search term for specialized hospitals
  const symptomToSpecialtyMap: { [key: string]: string } = {
    stomachache: "gastroenterology",
    fever: "general hospital",
    cardiac: "cardiology",
    headache: "neurology",
    cough: "pulmonology",
    fracture: "orthopedics",
    skin: "dermatology",
    maternity: "maternity hospital",
    eye: "ophthalmology",
  };

  // ✅ Fallback to "hospital" if no match is found
  const searchQuery =
    symptomToSpecialtyMap[symptom.toLowerCase()] || "hospital";

  // ✅ Google Places API URL to search specific hospitals based on symptom
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&keyword=${encodeURIComponent(
    searchQuery
  )}&key=${apiKey}`;

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    // ✅ Fetch from Google Places API and Geocoding API
    const [placesRes, geoRes] = await Promise.all([
      fetch(placesUrl),
      fetch(geoUrl),
    ]);
    const placesData = await placesRes.json();
    const geoData = await geoRes.json();

    if (placesData.status !== "OK") {
      return NextResponse.json(
        { error: placesData.error_message || "Google Places API error" },
        { status: 400 }
      );
    }

    // ✅ Format hospital data
    const hospitals = placesData.results.map((h: any) => ({
      name: h.name,
      address: h.vicinity,
      location: h.geometry.location,
      place_id: h.place_id,
    }));

    // ✅ Get user’s formatted address
    const userAddress =
      geoData.results[0]?.formatted_address || "Unknown address";

    return NextResponse.json({ hospitals, userAddress });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
