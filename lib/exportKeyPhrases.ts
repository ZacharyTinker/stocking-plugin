import { Verse } from "@/types/scripture";
import { wrapAddonHtml } from "./exportKeywords";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Builds the Key Phrases HTML section.
 * Shows unique 2-word and/or 3-word phrases organized by book → chapter → verse.
 */
export function keyPhrasesSection(
  verses: Verse[],
  uniquePhrases: Set<string>,
  phraseVerseMap: Map<string, string>,
  passageTitle: string,
  include2Word: boolean,
  include3Word: boolean
): string {
  if (!include2Word && !include3Word) return "";

  // Build verse lookup
  const verseLookup = new Map<string, Verse>();
  for (const v of verses) {
    verseLookup.set(`${v.book} ${v.chapter}:${v.verse}`, v);
  }

  // Separate 2-word and 3-word phrases, map verseId → phrases
  const versePhrase2 = new Map<string, string[]>();
  const versePhrase3 = new Map<string, string[]>();

  for (const phrase of uniquePhrases) {
    const wordCount = phrase.split(" ").length;
    const verseId = phraseVerseMap.get(phrase);
    if (!verseId) continue;
    if (wordCount === 2 && include2Word) {
      if (!versePhrase2.has(verseId)) versePhrase2.set(verseId, []);
      versePhrase2.get(verseId)!.push(phrase);
    } else if (wordCount === 3 && include3Word) {
      if (!versePhrase3.has(verseId)) versePhrase3.set(verseId, []);
      versePhrase3.get(verseId)!.push(phrase);
    }
  }

  function buildPhraseSection(title: string, verseMap: Map<string, string[]>): string {
    if (verseMap.size === 0) return "";

    // Sort verse IDs by book/chapter/verse order (using the order they appear in verses)
    const verseOrder = new Map<string, number>();
    verses.forEach((v, i) => verseOrder.set(`${v.book} ${v.chapter}:${v.verse}`, i));
    const sortedIds = [...verseMap.keys()].sort((a, b) => (verseOrder.get(a) ?? 0) - (verseOrder.get(b) ?? 0));

    // Group by book then chapter
    let html = `<div class="kp-section-title">${esc(title)}</div>`;
    let currentBook = "";
    let currentChapter = -1;

    for (const verseId of sortedIds) {
      const v = verseLookup.get(verseId);
      if (!v) continue;
      const phrases = verseMap.get(verseId)!;

      if (v.book !== currentBook) {
        currentBook = v.book;
        currentChapter = -1;
        html += `<div class="kp-book">${esc(v.book)}</div>`;
      }
      if (v.chapter !== currentChapter) {
        currentChapter = v.chapter;
        // chapter heading is implied by the verse numbers
      }

      for (let i = 0; i < phrases.length; i++) {
        const p = phrases[i].toUpperCase();
        if (i === 0) {
          html += `<div class="kp-row"><span class="kp-vnum">${v.chapter}:${v.verse}</span><span class="kp-phrase">${esc(p)}</span></div>`;
        } else {
          html += `<div class="kp-row"><span class="kp-vnum"></span><span class="kp-phrase">${esc(p)}</span></div>`;
        }
      }
    }

    return html;
  }

  const sec2 = include2Word ? buildPhraseSection("2-Word Phrases", versePhrase2) : "";
  const sec3 = include3Word ? buildPhraseSection("3-Word Phrases", versePhrase3) : "";

  const totalCount = (include2Word ? versePhrase2.size : 0) + (include3Word ? versePhrase3.size : 0);
  if (!sec2 && !sec3) {
    return `<div class="addon-section"><h2 class="addon-title">Key Phrases</h2><p class="addon-subtitle">No unique phrases found. Enable phrase analysis in Settings.</p></div>`;
  }

  return `<div class="addon-section">
<h2 class="addon-title">Key Phrases</h2>
<p class="addon-subtitle">${esc(passageTitle)}</p>
${sec2}${sec3}
</div>`;
}

export function exportKeyPhrases(
  verses: Verse[],
  uniquePhrases: Set<string>,
  phraseVerseMap: Map<string, string>,
  passageTitle: string,
  include2Word: boolean,
  include3Word: boolean
): void {
  const body = keyPhrasesSection(verses, uniquePhrases, phraseVerseMap, passageTitle, include2Word, include3Word);
  const html = wrapAddonHtml(body, `${passageTitle} — Key Phrases`);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Key Phrases.html`;
  a.click();
  URL.revokeObjectURL(url);
}
