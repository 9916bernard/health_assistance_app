import { NextResponse } from "next/server";

interface HospitalResult {
  name: string;
  vicinity: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export async function POST(req: Request) {
  const { latitude, longitude, symptom } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

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

  const searchQuery =
    symptomToSpecialtyMap[symptom.toLowerCase()] || "hospital";

  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&keyword=${encodeURIComponent(
    searchQuery
  )}&key=${apiKey}`;

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
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

    const hospitals = (placesData.results as HospitalResult[]).map((h) => ({
      name: h.name,
      address: h.vicinity,
      location: h.geometry.location,
      place_id: h.place_id,
    }));

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
