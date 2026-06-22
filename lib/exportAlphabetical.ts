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

function jumpPointIndex(text: string, uniqueWords: Set<string>): number {
  const tokens = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < Math.min(5, tokens.length); i++) {
    if (uniqueWords.has(normWord(tokens[i]))) return i + 1;
  }
  return 0;
}

function formatWithJump(text: string, uniqueWords: Set<string>): string {
  const tokens = text.split(/\s+/).filter(Boolean);
  const jpIdx = jumpPointIndex(text, uniqueWords);
  // Show only first 5 display tokens
  const display = tokens.slice(0, 5);
  if (jpIdx === 0) return display.join(" ") + " ‖";
  return display.map((tok, i) => (i + 1 === jpIdx ? tok + "/" : tok)).join(" ");
}

function sortKey(text: string): string {
  return text.toLowerCase().replace(/^[^a-z]+/i, "");
}

export function alphabeticalSection(
  verses: Verse[],
  uniqueWords: Set<string>,
  passageTitle: string
): string {
  const book = verses[0]?.book ?? "";
  const bookAbbr = BOOK_ABBREV[book] ?? book.slice(0, 4);

  const rows = verses
    .filter((v) => v.text.trim())
    .map((v) => ({
      text: formatWithJump(v.text, uniqueWords),
      ref: `${bookAbbr} ${v.chapter}:${v.verse}`,
      sortKey: sortKey(v.text),
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const tableRows = rows
    .map((r) => `<tr><td class="alpha-text">${esc(r.text)}</td><td class="alpha-ref">${esc(r.ref)}</td></tr>`)
    .join("\n");

  return `<div class="addon-section">
<h2 class="addon-title">Verses &mdash; Alphabetical</h2>
<p class="addon-subtitle">${esc(passageTitle)}</p>
<table class="alpha-table"><tbody>
${tableRows}
</tbody></table>
</div>`;
}

export function exportAlphabetical(
  verses: Verse[],
  uniqueWords: Set<string>,
  passageTitle: string
): void {
  const body = alphabeticalSection(verses, uniqueWords, passageTitle);
  const html = wrapAddonHtml(body, `${passageTitle} — Alphabetical`);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Alphabetical.html`;
  a.click();
  URL.revokeObjectURL(url);
}
