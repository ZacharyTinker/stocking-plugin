import { Verse } from "@/types/scripture";

/**
 * Shared text parser for ESV and api.bible plain-text responses.
 *
 * Both APIs return passages where verse numbers appear as inline [N] markers.
 * Paragraphs may span multiple verses; section headings appear on lines without [N].
 *
 * Edge cases handled:
 *   - [N] at end of line with no text → text continues on the next non-marker line
 *   - Indented non-marker lines (poetry / dialogue continuation) → appended to the
 *     previous verse. Headings are flush-left; poetry/dialogue lines are indented,
 *     which is how both APIs distinguish them in plain-text output.
 *   - Flush-left non-marker lines → section heading candidates
 *   - Bare digit lines (chapter numbers) → skipped
 *   - USFM paragraph markers (\p, \q1, \m, …) that api.bible may include → stripped
 *   - Chapter boundary: verse [1] reappearing after at least one verse has been seen
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

  // When [N] appears with no following text on the same line, we park the verse
  // metadata here and attach text from the next non-marker line.
  let pendingVerse: { verseNum: number; chapter: number; heading: string | undefined } | null = null;

  function flushHeading(): string | undefined {
    const h = pendingHeading.join(" ").trim() || undefined;
    pendingHeading.length = 0;
    return h;
  }

  function commitPendingVerse(text: string) {
    if (!pendingVerse) return;
    verses.push({
      book: bookName,
      chapter: pendingVerse.chapter,
      verse: pendingVerse.verseNum,
      sectionHeading: pendingVerse.heading,
      text,
    });
    pendingVerse = null;
  }

  for (const rawLine of lines) {
    // Detect leading indentation in the raw line *before* trimming. Headings are
    // flush-left; poetry and dialogue continuation lines are indented.
    const indented = /^[ \t]/.test(rawLine);

    const line = rawLine.trim();
    if (!line) continue;

    // Strip USFM paragraph markers (api.bible sometimes includes them in text content)
    const cleaned = line
      .replace(/^\\[a-z][a-z0-9]* ?/i, "")   // leading \p, \q1, \m, \li1, etc.
      .trim();

    if (!cleaned) continue;

    // No [N] verse markers on this line
    if (!/\[\d+\]/.test(cleaned)) {
      // Bare digit lines are chapter-number labels — skip them
      if (/^\d+$/.test(cleaned)) continue;

      if (pendingVerse) {
        // This line is the text content for the pending empty-text verse
        const text = stripMarkers(cleaned);
        if (text) {
          commitPendingVerse(text);
          seenFirstVerse = true;
        }
        // If still empty after stripping (e.g. pure footnote marker line), keep waiting
      } else if (indented && verses.length > 0) {
        // Indented continuation of the previous verse (poetry / wrapped dialogue),
        // not a heading. Append it to the last verse's text.
        const text = stripMarkers(cleaned);
        if (text) {
          const prev = verses[verses.length - 1];
          prev.text = prev.text ? `${prev.text} ${text}` : text;
        }
      } else {
        // Flush-left line with no pending verse — treat as a section heading
        pendingHeading.push(cleaned);
      }
      continue;
    }

    // This line has [N] markers.  If we had a pending empty-text verse, its text
    // never came — push it with an empty string so the verse number is preserved.
    if (pendingVerse) {
      commitPendingVerse("");
      seenFirstVerse = true;
    }

    // Split on [N] markers. Capture group keeps the number in the result array.
    // "[4] foo [5] bar" → ["", "4", " foo ", "5", " bar"]
    const parts = cleaned.split(/\[(\d+)\]/);

    for (let i = 1; i < parts.length; i += 2) {
      const verseNum = parseInt(parts[i], 10);
      const rawText = (parts[i + 1] ?? "").trim();
      const text = stripMarkers(rawText);

      // Detect chapter boundary: [1] reappearing after the first verse
      if (verseNum === 1 && seenFirstVerse) {
        // Flush any pending verse before incrementing
        if (pendingVerse) { commitPendingVerse(""); }
        currentChapter += 1;
      }

      const heading = flushHeading();
      seenFirstVerse = true;

      if (!text) {
        // [N] with no text — might be the last segment on the line, with text following
        const isLastSegment = i + 2 >= parts.length;
        if (isLastSegment) {
          // Park it; next non-marker line will supply the text
          pendingVerse = { verseNum, chapter: currentChapter, heading };
        } else {
          // Not the last segment — the verse genuinely has no text (e.g. merged [43][44] text)
          // Push with empty string to preserve the verse number in the count
          verses.push({ book: bookName, chapter: currentChapter, verse: verseNum, sectionHeading: heading, text: "" });
        }
        continue;
      }

      verses.push({
        book: bookName,
        chapter: currentChapter,
        verse: verseNum,
        sectionHeading: heading,
        text,
      });
    }
  }

  // Flush any remaining pending verse at end of input
  if (pendingVerse) {
    commitPendingVerse("");
  }

  return verses;
}

function stripMarkers(text: string): string {
  return text
    .replace(/\[[a-z]\]/gi, "")   // footnote markers [a] [b]
    .replace(/\(\d+\)/g, "")      // cross-ref markers (1) (2)
    .replace(/\\[a-z][a-z0-9]*/gi, "")  // inline USFM markers \nd \add \wj etc.
    .replace(/\s{2,}/g, " ")
    .trim();
}
