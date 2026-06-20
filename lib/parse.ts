import { Verse } from "@/types/scripture";

/**
 * Parse pasted/uploaded Scripture text.
 *
 * Supported plain-text format:
 *   [Section Heading]          <- optional, inside square brackets
 *   1:1 Verse text here.
 *   1:2 More verse text.
 *
 * The book name is supplied separately by the user.
 */
export function parsePlainText(book: string, raw: string): Verse[] {
  const verses: Verse[] = [];
  const lines = raw.split("\n");
  let currentHeading: string | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Section heading: [Some Heading] or == Some Heading ==
    const headingMatch = line.match(/^\[(.+)\]$/) || line.match(/^==\s*(.+?)\s*==$/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      continue;
    }

    // Verse line: chapter:verse text  (e.g. "1:1 Paul, called...")
    const verseMatch = line.match(/^(\d+):(\d+)\s+(.+)$/);
    if (verseMatch) {
      verses.push({
        book,
        chapter: parseInt(verseMatch[1], 10),
        verse: parseInt(verseMatch[2], 10),
        sectionHeading: currentHeading,
        text: verseMatch[3].trim(),
      });
      // section heading only applies to first verse after it
      currentHeading = undefined;
      continue;
    }

    // Fallback: bare verse number at start "1 Text..."
    const bareVerseMatch = line.match(/^(\d+)\s+(.+)$/);
    if (bareVerseMatch && verses.length > 0) {
      const lastChapter = verses[verses.length - 1].chapter;
      verses.push({
        book,
        chapter: lastChapter,
        verse: parseInt(bareVerseMatch[1], 10),
        sectionHeading: currentHeading,
        text: bareVerseMatch[2].trim(),
      });
      currentHeading = undefined;
    }
  }

  return verses;
}

/** Parse JSON array of Verse objects (structured import). */
export function parseJSON(raw: string): Verse[] {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Expected a JSON array of verse objects.");
  return data as Verse[];
}
