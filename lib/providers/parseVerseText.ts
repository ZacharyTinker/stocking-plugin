import { Verse } from "@/types/scripture";

/**
 * Shared text parser for ESV and api.bible responses.
 *
 * Both APIs return plain-text passages where verse numbers appear as inline
 * [N] markers. Paragraphs may span multiple verses. Section headings appear
 * on their own lines without a [N] prefix.
 *
 * Strategy:
 *   - Split each line on all [N] markers to extract individual verses.
 *   - Non-verse lines that appear between verses become section headings
 *     attached to the next verse encountered.
 *   - Chapter tracking: start at startChapter and increment each time
 *     verse [1] reappears after the first verse has been seen.
 */
export function parseVerseText(
  rawText: string,
  bookName: string,
  startChapter: number
): Verse[] {
  const verses: Verse[] = [];
  const lines = rawText.split("\n");

  let currentChapter = startChapter;
  let seenFirstVerse = false;
  const pendingHeading: string[] = [];

  function flushHeading(): string | undefined {
    const h = pendingHeading.join(" ").trim() || undefined;
    pendingHeading.length = 0;
    return h;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      // Empty line — paragraph break, flush any accumulated heading text
      // only if no verses have been emitted after it yet (handled lazily)
      continue;
    }

    // Check if this line contains any [N] verse markers
    if (!/\[\d+\]/.test(line)) {
      // No verse markers → treat as section heading text
      // Skip lines that look like chapter number labels (bare digit)
      if (!/^\d+$/.test(line)) {
        pendingHeading.push(line);
      }
      continue;
    }

    // Split the line on [N] markers.
    // "split" with a capture group includes the captured text in the result array.
    // e.g. "[4] foo [5] bar" → ["", "4", " foo ", "5", " bar"]
    const parts = line.split(/\[(\d+)\]/);

    for (let i = 1; i < parts.length; i += 2) {
      const verseNum = parseInt(parts[i], 10);
      const text = stripMarkers((parts[i + 1] ?? "").trim());

      if (!text) continue;

      // Detect chapter boundary: [1] reappearing after we've seen at least one verse
      if (verseNum === 1 && seenFirstVerse) {
        currentChapter += 1;
      }

      const heading = seenFirstVerse ? flushHeading() : flushHeading(); // always flush
      seenFirstVerse = true;

      verses.push({
        book: bookName,
        chapter: currentChapter,
        verse: verseNum,
        sectionHeading: heading,
        text,
      });
    }
  }

  return verses;
}

function stripMarkers(text: string): string {
  return text
    .replace(/\[[a-z]\]/g, "")   // footnote markers [a] [b]
    .replace(/\(\d+\)/g, "")     // cross-ref markers (1) (2)
    .replace(/\s{2,}/g, " ")
    .trim();
}
