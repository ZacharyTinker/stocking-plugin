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
  return parseESVResponse(data, ref.book);
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

function parseESVResponse(data: ESVResponse, bookName: string): Verse[] {
  const verses: Verse[] = [];
  const passages = data.passages ?? [];

  for (const passage of passages) {
    const lines = passage.split("\n");
    let currentChapter = 0;
    let currentHeading: string | undefined;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Chapter heading: "John 3" or "1 Corinthians 1"
      const chapterMatch = line.match(/^[1-3]?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(\d+)$/);
      if (chapterMatch) {
        currentChapter = parseInt(chapterMatch[1], 10);
        continue;
      }

      // Section heading: a line with no leading [verse] marker and no verse number
      const isVerseStart = line.match(/^\[?(\d+)\]?\s/);
      if (!isVerseStart && line.length > 0 && !/^\d+$/.test(line)) {
        // Heuristic: section headings are short non-verse lines
        if (line.length < 120 && currentChapter > 0) {
          currentHeading = line;
          continue;
        }
      }

      // Verse line: [1] text or 1 text
      const verseMatch = line.match(/^\[?(\d+)\]?\s+(.+)$/);
      if (verseMatch) {
        const verseNum = parseInt(verseMatch[1], 10);
        let text = verseMatch[2].trim();
        // Strip any trailing footnote markers like [a] [b]
        text = text.replace(/\[[a-z]\]/g, "").trim();

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
