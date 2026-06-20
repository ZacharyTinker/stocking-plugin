import { NextRequest, NextResponse } from "next/server";
import { fetchESVPassage } from "@/lib/providers/esv";
import { PassageRef } from "@/lib/providers/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const provider = searchParams.get("provider") ?? "esv";
  const book = searchParams.get("book");
  const startChapter = parseInt(searchParams.get("startChapter") ?? "0", 10);
  const endChapter = parseInt(searchParams.get("endChapter") ?? "0", 10);
  const startVerse = searchParams.get("startVerse") ? parseInt(searchParams.get("startVerse")!, 10) : undefined;
  const endVerse = searchParams.get("endVerse") ? parseInt(searchParams.get("endVerse")!, 10) : undefined;

  if (!book || !startChapter || !endChapter) {
    return NextResponse.json({ error: "Missing required params: book, startChapter, endChapter" }, { status: 400 });
  }

  const ref: PassageRef = { book, startChapter, endChapter, startVerse, endVerse };

  try {
    if (provider === "esv") {
      const apiKey = process.env.ESV_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "ESV_API_KEY is not configured on the server." }, { status: 500 });
      }
      const verses = await fetchESVPassage(ref, apiKey);
      return NextResponse.json({ verses });
    }

    // Future: api.bible provider
    // if (provider === "apibible") { ... }

    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
