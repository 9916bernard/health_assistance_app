import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { latitude, longitude } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=hospital&key=${apiKey}`;
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

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

  const hospitals = placesData.results.map((h: any) => ({
    name: h.name,
    address: h.vicinity,
    location: h.geometry.location,
    place_id: h.place_id,
  }));

  const userAddress =
    geoData.results[0]?.formatted_address || "Unknown address";

  return NextResponse.json({ hospitals, userAddress });
}
