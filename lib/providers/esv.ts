/**
 * ESV API provider — api.esv.org
 * API key must be set as ESV_API_KEY in environment variables.
 * Called server-side only (API route).
 *
 * The ESV API limits requests to ~500 verses. We chunk large chapter
 * ranges into groups of CHUNK_SIZE chapters and combine results.
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";
import { parseVerseText } from "./parseVerseText";

const BASE = "https://api.esv.org/v3/passage/text/";

// 2 chapters per chunk. Kept in lockstep with the api.bible provider, which must
// stay under a 200-verse response cap. 2 chapters (~100 verses typical) is safe.
const CHUNK_SIZE = 2;

export async function fetchESVPassage(ref: PassageRef, apiKey: string): Promise<Verse[]> {
  const totalChapters = ref.endChapter - ref.startChapter + 1;

  if (totalChapters <= CHUNK_SIZE) {
    return fetchChunk(ref, apiKey);
  }

  const allVerses: Verse[] = [];
  let chunkStart = ref.startChapter;

  while (chunkStart <= ref.endChapter) {
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, ref.endChapter);
    const verses = await fetchChunk({ ...ref, startChapter: chunkStart, endChapter: chunkEnd }, apiKey);
    allVerses.push(...verses);
    chunkStart = chunkEnd + 1;
  }

  return allVerses;
}

async function fetchChunk(ref: PassageRef, apiKey: string): Promise<Verse[]> {
  const query = buildQuery(ref);
  const url = `${BASE}?${new URLSearchParams({
    q: query,
    "include-passage-references": "false",
    "include-verse-numbers": "true",
    "include-first-verse-numbers": "true",
    "include-footnotes": "false",
    "include-footnote-body": "false",
    "include-cross-references": "false",
    "include-selahs": "true",
    "include-headings": "true",
    "include-short-copyright": "false",
    "include-copyright": "false",
    "include-passage-horizontal-lines": "false",
    "include-heading-horizontal-lines": "false",
    "indent-paragraphs": "0",
    "indent-poetry": "true",
    "indent-declares": "0",
    "indent-psalm-doxology": "0",
    "line-length": "0",
  })}`;

  const res = await fetch(url, {
    headers: { Authorization: `Token ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ESV API error ${res.status} (${ref.book} ${ref.startChapter}–${ref.endChapter}): ${body}`);
  }

  const data = await res.json() as { passages?: string[] };
  if (!data.passages?.length) {
    throw new Error(`ESV API returned no text for ${ref.book} ${ref.startChapter}–${ref.endChapter}. Check the passage reference.`);
  }
  const text = data.passages.join("\n");
  return parseVerseText(text, ref.book, ref.startChapter);
}

function buildQuery(ref: PassageRef): string {
  if (ref.startChapter === ref.endChapter && !ref.endVerse) {
    // Single chapter — "Luke 6" or "Luke 6:3"
    return ref.startVerse
      ? `${ref.book} ${ref.startChapter}:${ref.startVerse}`
      : `${ref.book} ${ref.startChapter}`;
  }

  const start = ref.startVerse
    ? `${ref.book} ${ref.startChapter}:${ref.startVerse}`
    : `${ref.book} ${ref.startChapter}`;

  // Use short-form end ("10" or "10:42") when the book is the same, so the
  // ESV API receives "Luke 6-10" rather than "Luke 6-Luke 10". The latter can
  // confuse the parser and return an empty passages array for some ranges.
  const end = ref.endVerse ? `${ref.endChapter}:${ref.endVerse}` : `${ref.endChapter}`;

  return `${start}-${end}`;
}
