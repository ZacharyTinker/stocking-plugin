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
 * api.bible silently truncates any passage response at 200 verses (confirmed:
 * requesting Luke 21-24 = 218 verses returns exactly 200, cut off mid-chapter).
 * We chunk large chapter ranges into groups of CHUNK_SIZE chapters and combine
 * results so no single request can exceed the cap.
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";
import { parseVerseText } from "./parseVerseText";
import { usfmId } from "@/lib/bookList";

const BASE = "https://api.scripture.api.bible/v1";

// 2 chapters per chunk. api.bible truncates responses at 200 verses. NT chapters
// average ~50 verses, so 2 chapters (~100 verses) sits comfortably under the cap.
// Edge case: Psalm 119 (176 verses) adjacent to another psalm can exceed 200 at a
// chunk boundary — see VERSE_CAP guard below, which re-splits any chunk that hits
// the cap so no verses are silently dropped.
const CHUNK_SIZE = 2;
const VERSE_CAP = 200;

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
    let chunkVerses = await fetchChunk(
      { ...ref, startChapter: chunkStart, endChapter: chunkEnd },
      apiKey,
      bibleId
    );

    // If a multi-chapter chunk hit the 200-verse cap, the API may have truncated
    // it. Re-fetch each chapter individually so nothing is silently dropped.
    if (chunkVerses.length >= VERSE_CAP && chunkEnd > chunkStart) {
      chunkVerses = [];
      for (let ch = chunkStart; ch <= chunkEnd; ch++) {
        const single = await fetchChunk(
          { ...ref, startChapter: ch, endChapter: ch },
          apiKey,
          bibleId
        );
        chunkVerses.push(...single);
      }
    }

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

  // Chapter-level passage IDs (no verse suffix). The previous .999 end-verse caused
  // some chunks to return empty; chapter-level IDs are more reliable.
  const passageId = `${bookUsfm}.${ref.startChapter}-${bookUsfm}.${ref.endChapter}`;

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
  if (!text.trim()) {
    throw new Error(`api.bible returned no text for ${ref.book} ${ref.startChapter}–${ref.endChapter}. Check the passage reference and Bible ID.`);
  }
  return parseVerseText(text, ref.book, ref.startChapter);
}

