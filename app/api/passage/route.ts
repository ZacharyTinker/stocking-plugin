import { NextRequest, NextResponse } from "next/server";
import { fetchESVPassage } from "@/lib/providers/esv";
import { fetchApiBiblePassage } from "@/lib/providers/apibible";
import { PassageRef } from "@/lib/providers/types";
import { Verse } from "@/types/scripture";
import { getTranslation } from "@/lib/translations";

async function fetchSegment(
  translationId: string,
  ref: PassageRef
): Promise<Verse[]> {
  const translation = getTranslation(translationId);
  if (!translation) throw new Error(`Unknown translation: ${translationId}`);

  if (translation.provider === "esv") {
    const apiKey = process.env.ESV_API_KEY;
    if (!apiKey) throw new Error("ESV_API_KEY is not configured on the server.");
    return fetchESVPassage(ref, apiKey);
  }

  if (translation.provider === "apibible") {
    const apiKey = process.env.API_BIBLE_KEY;
    if (!apiKey) throw new Error("API_BIBLE_KEY is not configured on the server.");

    // Resolve the Bible ID: use the hardcoded one or look up from env
    const bibleId =
      translation.bibleId ??
      (translation.bibleIdEnvVar ? process.env[translation.bibleIdEnvVar] : undefined);
    if (!bibleId) {
      throw new Error(
        `Bible ID for ${translation.name} is not configured. Set ${translation.bibleIdEnvVar} in environment variables.`
      );
    }

    return fetchApiBiblePassage(ref, apiKey, bibleId);
  }

  throw new Error(`Unknown provider for translation: ${translationId}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const translation = searchParams.get("translation") ?? "esv";
  const book = searchParams.get("book");
  const startChapter = parseInt(searchParams.get("startChapter") ?? "0", 10);
  const endChapter = parseInt(searchParams.get("endChapter") ?? "0", 10);
  const startVerse = searchParams.get("startVerse") ? parseInt(searchParams.get("startVerse")!, 10) : undefined;
  const endVerse = searchParams.get("endVerse") ? parseInt(searchParams.get("endVerse")!, 10) : undefined;

  if (!book || !startChapter || !endChapter) {
    return NextResponse.json({ error: "Missing required params: book, startChapter, endChapter" }, { status: 400 });
  }

  try {
    const verses = await fetchSegment(translation, { book, startChapter, endChapter, startVerse, endVerse });
    return NextResponse.json({ verses });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

/** POST body: { translation, segments: [{book, startChapter, endChapter}] } */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const translation: string = body.translation ?? "esv";
  const segments: Array<{ book: string; startChapter: number; endChapter: number }> = body.segments ?? [];

  if (!segments.length) {
    return NextResponse.json({ error: "No segments provided." }, { status: 400 });
  }

  try {
    const allVerses: Verse[] = [];
    for (const seg of segments) {
      const verses = await fetchSegment(translation, {
        book: seg.book,
        startChapter: seg.startChapter,
        endChapter: seg.endChapter,
      });
      allVerses.push(...verses);
    }
    return NextResponse.json({ verses: allVerses });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
