/**
 * ESV API provider — api.esv.org
 * Docs: https://api.esv.org/docs/passage-text/
 *
 * The API key must be set as ESV_API_KEY in environment variables.
 * Calls are made server-side only (API route), so the key is never
 * exposed to the browser.
 */

import { Verse } from "@/types/scripture";
import { PassageRef } from "./types";

const BASE = "https://api.esv.org/v3/passage/text/";

/** Called from the server-side API route — never from client code. */
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

  const data = await res.json();
  return parseESVResponse(data, ref.book, ref.startChapter);
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

function parseESVResponse(data: ESVResponse, bookName: string, startChapter: number): Verse[] {
  const verses: Verse[] = [];
  const passages = data.passages ?? [];

  for (const passage of passages) {
    const lines = passage.split("\n");

    // The ESV API plain-text response does not emit chapter-number lines when
    // include-passage-references is false. We track the chapter ourselves:
    // start at startChapter and bump whenever verse [1] appears after the
    // very first verse (every chapter starts at verse 1).
    let currentChapter = startChapter;
    let seenFirstVerse = false;
    let currentHeading: string | undefined;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Verse line: [1] text ...   (ESV wraps verse numbers in brackets)
      const verseMatch = line.match(/^\[(\d+)\]\s+(.+)$/);
      if (verseMatch) {
        const verseNum = parseInt(verseMatch[1], 10);

        // Detect chapter boundary: verse 1 appearing after the first verse
        if (verseNum === 1 && seenFirstVerse) {
          currentChapter += 1;
        }
        seenFirstVerse = true;

        let text = verseMatch[2].trim();
        // Strip inline footnote/cross-reference markers: [a], [b], (1), etc.
        text = text.replace(/\[[a-z]\]/gi, "").replace(/\s{2,}/g, " ").trim();

        verses.push({
          book: bookName,
          chapter: currentChapter,
          verse: verseNum,
          sectionHeading: currentHeading,
          text,
        });
        currentHeading = undefined;
        continue;
      }

      // Any other non-empty line before or between verses is a section heading.
      // Skip bare digits (shouldn't appear, but defensive).
      if (!/^\d+$/.test(line)) {
        currentHeading = line;
      }
    }
  }

  return verses;
}

interface ESVResponse {
  query: string;
  canonical: string;
  parsed: number[][];
  passage_meta: unknown[];
  passages: string[];
}
