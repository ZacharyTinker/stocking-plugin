import { Verse } from "@/types/scripture";
import { wrapAddonHtml } from "./exportKeywords";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BOOK_ABBREV: Record<string, string> = {
  "Genesis": "Gen", "Exodus": "Ex", "Leviticus": "Lev", "Numbers": "Num",
  "Deuteronomy": "Deut", "Joshua": "Josh", "Judges": "Judg", "Ruth": "Ruth",
  "1 Samuel": "1 Sam", "2 Samuel": "2 Sam", "1 Kings": "1 Ki", "2 Kings": "2 Ki",
  "1 Chronicles": "1 Chr", "2 Chronicles": "2 Chr", "Ezra": "Ezra", "Nehemiah": "Neh",
  "Esther": "Est", "Job": "Job", "Psalms": "Ps", "Proverbs": "Prov",
  "Ecclesiastes": "Ecc", "Song of Solomon": "SoS", "Isaiah": "Isa", "Jeremiah": "Jer",
  "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan", "Hosea": "Hos",
  "Joel": "Joel", "Amos": "Amos", "Obadiah": "Ob", "Jonah": "Jon",
  "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zeph",
  "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal",
  "Matthew": "Mt", "Mark": "Mk", "Luke": "Lk", "John": "J",
  "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1 Cor", "2 Corinthians": "2 Cor",
  "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phil", "Colossians": "Col",
  "1 Thessalonians": "1 Th", "2 Thessalonians": "2 Th", "1 Timothy": "1 Tim",
  "2 Timothy": "2 Tim", "Titus": "Tit", "Philemon": "Phm", "Hebrews": "Heb",
  "James": "Jas", "1 Peter": "1 Pet", "2 Peter": "2 Pet",
  "1 John": "1 Jn", "2 John": "2 Jn", "3 John": "3 Jn",
  "Jude": "Jude", "Revelation": "Rev",
};

function normWord(token: string): string {
  let t = token.toLowerCase();
  t = t.replace(/^['']+/, "");
  if (!/s['']+$/.test(t)) t = t.replace(/['']+$/, "");
  t = t.replace(/[''ʼ]/g, "'").replace(/[^a-z0-9'-]/g, "");
  t = t.replace(/([^s])'+$/g, "$1").replace(/^'+/, "");
  return t;
}

const SNIPPET_THRESHOLD = 15; // if total occurrences > this, show refs only (no context)
const CONTEXT_WORDS = 3;      // words on each side of ♦

interface Occurrence {
  ref: string;
  snippet: string;
}

function getOccurrences(
  normalizedWord: string,
  verseIds: string[],
  verseLookup: Map<string, Verse>,
  book: string
): Occurrence[] {
  const bookAbbr = BOOK_ABBREV[book] ?? book.slice(0, 4);
  const results: Occurrence[] = [];

  for (const verseId of verseIds) {
    const v = verseLookup.get(verseId);
    if (!v) continue;
    const ref = `${bookAbbr} ${v.chapter}:${v.verse}`;
    const displayTokens = v.text.split(/\s+/).filter(Boolean);

    for (let i = 0; i < displayTokens.length; i++) {
      if (normWord(displayTokens[i]) === normalizedWord) {
        const before = displayTokens.slice(Math.max(0, i - CONTEXT_WORDS), i).join(" ");
        const after = displayTokens.slice(i + 1, i + 1 + CONTEXT_WORDS).join(" ");
        const snippet = [before, "♦", after].filter(Boolean).join(" ");
        results.push({ ref, snippet });
      }
    }
  }

  return results;
}

export function concordanceSection(
  verses: Verse[],
  wordFrequency: Map<string, number>,
  wordVerseIndex: Map<string, string[]>,
  passageTitle: string
): string {
  const book = verses[0]?.book ?? "";
  const bookAbbr = BOOK_ABBREV[book] ?? book.slice(0, 4);

  const verseLookup = new Map<string, Verse>();
  for (const v of verses) {
    verseLookup.set(`${v.book} ${v.chapter}:${v.verse}`, v);
  }

  const words = [...wordFrequency.keys()].sort((a, b) => a.localeCompare(b));

  let entries = "";
  for (const word of words) {
    const count = wordFrequency.get(word) ?? 0;
    const verseIds = wordVerseIndex.get(word) ?? [];

    entries += `<div class="conc-entry">`;
    entries += `<span class="conc-word">${esc(word.toUpperCase())}</span> `;
    entries += `<span class="conc-count">(${count})</span>`;

    if (count > SNIPPET_THRESHOLD) {
      // Refs only
      const refs = verseIds
        .map((id) => {
          const v = verseLookup.get(id);
          return v ? `${bookAbbr} ${v.chapter}:${v.verse}` : id;
        })
        .join(", ");
      entries += `<div class="conc-refs">${esc(refs)}</div>`;
    } else {
      // Snippets
      const occurrences = getOccurrences(word, verseIds, verseLookup, book);
      for (const { ref, snippet } of occurrences) {
        entries += `<div class="conc-snippet-line"><span class="conc-ref">${esc(ref)}</span> &ndash; ${esc(snippet)}</div>`;
      }
    }

    entries += `</div>\n`;
  }

  return `<div class="addon-section">
<h2 class="addon-title">Concordance</h2>
<p class="addon-subtitle">${esc(passageTitle)} &mdash; ${words.length} words</p>
${entries}
</div>`;
}

export function exportConcordance(
  verses: Verse[],
  wordFrequency: Map<string, number>,
  wordVerseIndex: Map<string, string[]>,
  passageTitle: string
): void {
  const body = concordanceSection(verses, wordFrequency, wordVerseIndex, passageTitle);
  const html = wrapAddonHtml(body, `${passageTitle} — Concordance`);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Concordance.html`;
  a.click();
  URL.revokeObjectURL(url);
}
