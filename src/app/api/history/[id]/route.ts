// src/app/api/history/[id]/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { username } = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("health-data");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      username,
    });

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Message not found or not authorized" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
