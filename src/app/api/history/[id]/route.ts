// src/app/api/history/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("health-assistant");
    const collection = db.collection("chats");

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
