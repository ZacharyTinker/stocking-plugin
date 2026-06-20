/**
 * api.bible provider — scripture.api.bible
 * API key must be set as API_BIBLE_KEY in environment variables.
 * Called server-side only.
 *
 * Bible IDs (set in env or use the constants below):
 *   KJV:  de4e12af7f28f599-02  (public domain, always available)
 *   NIV:  set API_BIBLE_NIV_ID  (requires Biblica license via api.bible)
 *   NASB: set API_BIBLE_NASB_ID (requires Lockman license via api.bible)
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";
import { parseVerseText } from "./parseVerseText";
import { usfmId } from "@/lib/bookList";

const BASE = "https://api.scripture.api.bible/v1";

export async function fetchApiBiblePassage(
  ref: PassageRef,
  apiKey: string,
  bibleId: string
): Promise<Verse[]> {
  const bookUsfm = usfmId(ref.book);

  // Passage ID: "1CO.1.1-1CO.3.999" covers all verses in chapters 1–3
  const passageId = `${bookUsfm}.${ref.startChapter}.1-${bookUsfm}.${ref.endChapter}.999`;

  const url = `${BASE}/bibles/${bibleId}/passages/${passageId}?${new URLSearchParams({
    "content-type": "text",
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`api.bible error ${res.status}: ${body}`);
  }

  const data = await res.json() as { data?: { content?: string } };
  const text = data.data?.content ?? "";
  return parseVerseText(text, ref.book, ref.startChapter);
}
