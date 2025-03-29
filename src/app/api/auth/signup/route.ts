// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const client = await clientPromise;
    const db = client.db("health-assistant");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({ email, password: hashedPassword });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
