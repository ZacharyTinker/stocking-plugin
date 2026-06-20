/**
 * api.bible provider — scripture.api.bible
 * API key must be set as API_BIBLE_KEY in environment variables.
 * Called server-side only.
 *
 * Bible IDs (set in env or use the constants below):
 *   KJV:  de4e12af7f28f599-02  (public domain, always available)
 *   NIV:  set API_BIBLE_NIV_ID  (requires Biblica license via api.bible)
 *   NASB: set API_BIBLE_NASB_ID (requires Lockman license via api.bible)
 *
 * api.bible limits passages to ~500 verses per request. We chunk large
 * chapter ranges into groups of CHUNK_SIZE chapters and combine results.
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";
import { parseVerseText } from "./parseVerseText";
import { usfmId } from "@/lib/bookList";

const BASE = "https://api.scripture.api.bible/v1";

// 10 chapters per chunk ≈ 260 verses on average, well under the 500-verse limit.
// Poetry books (Psalms) can average 10+ verses/chapter so we stay conservative.
const CHUNK_SIZE = 10;

export async function fetchApiBiblePassage(
  ref: PassageRef,
  apiKey: string,
  bibleId: string
): Promise<Verse[]> {
  const totalChapters = ref.endChapter - ref.startChapter + 1;

  // Single chunk — fetch directly
  if (totalChapters <= CHUNK_SIZE) {
    return fetchChunk(ref, apiKey, bibleId);
  }

  // Multiple chunks — fetch sequentially and combine
  const allVerses: Verse[] = [];
  let chunkStart = ref.startChapter;

  while (chunkStart <= ref.endChapter) {
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, ref.endChapter);
    const chunkVerses = await fetchChunk(
      { ...ref, startChapter: chunkStart, endChapter: chunkEnd },
      apiKey,
      bibleId
    );
    allVerses.push(...chunkVerses);
    chunkStart = chunkEnd + 1;
  }

  return allVerses;
}

async function fetchChunk(
  ref: PassageRef,
  apiKey: string,
  bibleId: string
): Promise<Verse[]> {
  const bookUsfm = usfmId(ref.book);

  // Passage ID covers all verses in the chapter range
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
    throw new Error(`api.bible error ${res.status} (${ref.book} ${ref.startChapter}–${ref.endChapter}): ${body}`);
  }

  const data = await res.json() as { data?: { content?: string } };
  const text = data.data?.content ?? "";
  return parseVerseText(text, ref.book, ref.startChapter);
}

