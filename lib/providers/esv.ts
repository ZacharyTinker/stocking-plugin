/**
 * ESV API provider — api.esv.org
 * API key must be set as ESV_API_KEY in environment variables.
 * Called server-side only (API route).
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";
import { parseVerseText } from "./parseVerseText";

const BASE = "https://api.esv.org/v3/passage/text/";

export async function fetchESVPassage(ref: PassageRef, apiKey: string): Promise<Verse[]> {
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
    "indent-poetry": "false",
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
    throw new Error(`ESV API error ${res.status}: ${body}`);
  }

  const data = await res.json() as { passages?: string[] };
  const text = (data.passages ?? []).join("\n");
  return parseVerseText(text, ref.book, ref.startChapter);
}

function buildQuery(ref: PassageRef): string {
  const start = ref.startVerse
    ? `${ref.book} ${ref.startChapter}:${ref.startVerse}`
    : `${ref.book} ${ref.startChapter}`;
  const end = ref.endVerse
    ? `${ref.book} ${ref.endChapter}:${ref.endVerse}`
    : `${ref.book} ${ref.endChapter}`;
  return ref.startChapter === ref.endChapter && !ref.endVerse ? start : `${start}-${end}`;
}
