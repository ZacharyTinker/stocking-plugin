/**
 * Debug endpoint — returns the raw api.bible text for a passage.
 * Helps diagnose how verse numbers and content are formatted.
 * Example: /api/passage/raw-apibible?book=Luke&startChapter=1&endChapter=1
 */
import { NextRequest, NextResponse } from "next/server";
import { usfmId } from "@/lib/bookList";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const book = searchParams.get("book") ?? "Luke";
  const startChapter = parseInt(searchParams.get("startChapter") ?? "1", 10);
  const endChapter = parseInt(searchParams.get("endChapter") ?? "1", 10);
  const contentType = (searchParams.get("contentType") ?? "text") as "text" | "json";

  const apiKey = process.env.API_BIBLE_KEY;
  const bibleId = process.env.API_BIBLE_NIV_ID ?? process.env.API_BIBLE_NASB_ID;

  if (!apiKey) return NextResponse.json({ error: "API_BIBLE_KEY not set" }, { status: 500 });
  if (!bibleId) return NextResponse.json({ error: "API_BIBLE_NIV_ID or API_BIBLE_NASB_ID not set" }, { status: 500 });

  const bookUsfm = usfmId(book);
  const passageId = `${bookUsfm}.${startChapter}-${bookUsfm}.${endChapter}`;

  const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}?${new URLSearchParams({
    "content-type": contentType,
    "include-notes": "false",
    "include-titles": "true",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
    "include-verse-spans": "false",
  })}`;

  const res = await fetch(url, {
    headers: { "api-key": apiKey },
    cache: "no-store",
  });
  const data = await res.json();

  return NextResponse.json(
    { passageId, contentType, raw: data.data?.content ?? null, verseCount: data.data?.verseCount ?? null },
    { status: res.status }
  );
}
