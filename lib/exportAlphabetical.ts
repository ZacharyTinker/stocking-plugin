import { Verse, TokenizationOptions } from "@/types/scripture";

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

function abbrev(book: string): string {
  return BOOK_ABBREV[book] ?? book.slice(0, 4);
}

/** Normalize a display word token to a lookup key — simplified version without opts dependency */
function normWord(token: string): string {
  let t = token.toLowerCase();
  // Strip leading curly open-quote
  t = t.replace(/^['‘]+/, "");
  // Strip trailing curly close-quote unless possessive s'
  if (!/s['’]+$/.test(t)) t = t.replace(/['’]+$/, "");
  // Normalize apostrophes, strip non-alpha
  t = t.replace(/[''ʼ]/g, "'").replace(/[^a-z0-9'-]/g, "");
  t = t.replace(/([^s])'+$/g, "$1").replace(/^'+/, "");
  return t;
}

/**
 * Find the jump-point position (1-indexed word number) in a verse.
 * Returns 0 if no unique word found in first 5 words.
 */
function jumpPointIndex(text: string, uniqueWords: Set<string>): number {
  const tokens = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < Math.min(5, tokens.length); i++) {
    if (uniqueWords.has(normWord(tokens[i]))) return i + 1;
  }
  return 0;
}

/**
 * Insert the jump-point marker into the verse text.
 * Returns the text with " /" after the jump-point word, or text + " ||" if no valid jump.
 */
function formatWithJump(text: string, uniqueWords: Set<string>): string {
  const jpIdx = jumpPointIndex(text, uniqueWords); // 1-indexed
  if (jpIdx === 0) return text + " ‖"; // || (double bar)

  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens
    .map((tok, i) => (i + 1 === jpIdx ? tok + "/" : tok))
    .join(" ");
}

/** Sort key: strip leading punctuation/quotes for alphabetical ordering */
function sortKey(text: string): string {
  return text.toLowerCase().replace(/^[^a-z]+/i, "");
}

export function exportAlphabetical(
  verses: Verse[],
  uniqueWords: Set<string>,
  passageTitle: string
): void {
  const book = verses[0]?.book ?? "";
  const bookAbbr = abbrev(book);

  const rows = verses
    .filter((v) => v.text.trim())
    .map((v) => ({
      text: formatWithJump(v.text, uniqueWords),
      ref: `${bookAbbr} ${v.chapter}:${v.verse}`,
      sortKey: sortKey(v.text),
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Two columns
  const half = Math.ceil(rows.length / 2);
  const left = rows.slice(0, half);
  const right = rows.slice(half);
  const rowCount = Math.max(left.length, right.length);

  function cell(entry?: { text: string; ref: string }) {
    if (!entry) return `<td></td><td></td>`;
    return `<td class="verse-text">${esc(entry.text)}</td><td class="verse-ref">${esc(entry.ref)}</td>`;
  }

  let tableRows = "";
  for (let r = 0; r < rowCount; r++) {
    tableRows += `<tr>${cell(left[r])}<td class="gap"></td>${cell(right[r])}</tr>\n`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Verses — Alphabetical — ${esc(passageTitle)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 8pt; margin: 0.4in; }
  h1 { font-size: 13pt; text-align: center; margin-bottom: 2px; }
  h2 { font-size: 9pt; text-align: center; color: #555; margin-top: 0; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 2px; vertical-align: top; }
  td.verse-text { width: 38%; }
  td.verse-ref { width: 10%; text-align: right; color: #333; white-space: nowrap; padding-right: 4px; }
  td.gap { width: 4%; }
</style>
</head>
<body>
<h1>Verses — Alphabetical</h1>
<h2>${esc(passageTitle)}</h2>
<table>
${tableRows}
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Alphabetical.html`;
  a.click();
  URL.revokeObjectURL(url);
}
