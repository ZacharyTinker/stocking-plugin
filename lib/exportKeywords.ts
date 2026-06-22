import { Verse } from "@/types/scripture";

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

export function keywordsSection(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniqueWordVerses: Map<string, string>,
  passageTitle: string
): string {
  const book = verses[0]?.book ?? "";
  const bookAbbr = BOOK_ABBREV[book] ?? book.slice(0, 4);

  const rows = [...uniqueWords]
    .sort((a, b) => a.localeCompare(b))
    .map((w) => {
      const verseId = uniqueWordVerses.get(w) ?? "";
      const ref = verseId.replace(book, bookAbbr).trim();
      return `<tr><td class="kw-word">${esc(w.toUpperCase())}</td><td class="kw-ref">${esc(ref)}</td></tr>`;
    })
    .join("\n");

  return `<div class="addon-section">
<h2 class="addon-title">Keywords</h2>
<p class="addon-subtitle">${esc(passageTitle)} &mdash; ${uniqueWords.size} unique words</p>
<table class="kw-table"><tbody>
${rows}
</tbody></table>
</div>`;
}

export function exportKeywords(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniqueWordVerses: Map<string, string>,
  passageTitle: string
): void {
  const body = keywordsSection(verses, uniqueWords, uniqueWordVerses, passageTitle);
  downloadAddonHtml(body, passageTitle, "Keywords");
}

function downloadAddonHtml(body: string, passageTitle: string, label: string): void {
  const html = wrapAddonHtml(body, `${passageTitle} — ${label}`);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} ${label}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function wrapAddonHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; margin: 0.5in; }
  .addon-section { margin-bottom: 2em; }
  .addon-section + .addon-section { border-top: 2px solid #333; padding-top: 1.5em; page-break-before: always; }
  h1.doc-title { font-size: 14pt; text-align: center; margin-bottom: 2px; }
  .addon-title { font-size: 13pt; text-align: center; margin-bottom: 2px; margin-top: 0; }
  .addon-subtitle { font-size: 9pt; text-align: center; color: #555; margin-top: 0; margin-bottom: 8px; }
  /* Keywords */
  .kw-table { border-collapse: collapse; }
  .kw-word { font-weight: bold; padding: 1px 6px 1px 0; white-space: nowrap; }
  .kw-ref { color: #444; padding: 1px 0; }
  /* Alphabetical */
  .alpha-table { width: 100%; border-collapse: collapse; }
  .alpha-text { padding: 1px 4px 1px 0; }
  .alpha-ref { text-align: right; color: #333; white-space: nowrap; padding-left: 4px; }
  /* Key Verse Grid */
  .kvg-table { border-collapse: collapse; }
  .kvg-ch { font-weight: bold; width: 24px; text-align: right; padding-right: 6px; border-right: 2px solid #333; }
  .kvg-verses { padding-left: 6px; }
  .kvg-vn { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; margin: 1px; font-size: 7pt; font-weight: bold; padding: 0 2px; }
  .kvg-book { display: inline-block; font-weight: bold; font-size: 11pt; border: 2px solid #333; padding: 2px 8px; margin-bottom: 6px; }
  .kvg-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border: 1px solid #ccc; background: #f9f9f9; padding: 4px 8px; margin-bottom: 8px; font-size: 8pt; border-radius: 3px; }
  /* Key Phrases */
  .kp-section-title { font-size: 11pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  .kp-book { font-size: 10pt; font-weight: bold; margin: 0.5em 0 0.2em; text-decoration: underline; }
  .kp-row { margin: 1px 0; }
  .kp-vnum { display: inline-block; width: 2em; text-align: right; font-weight: bold; margin-right: 0.4em; }
  .kp-phrase { font-weight: bold; }
  /* Concordance */
  .conc-word { font-weight: bold; font-size: 9.5pt; }
  .conc-count { font-weight: normal; font-size: 8.5pt; color: #555; }
  .conc-entry { margin: 0 0 4px 0; }
  .conc-refs { color: #333; margin-left: 1em; font-size: 8.5pt; }
  .conc-snippet-line { margin-left: 1em; font-size: 8.5pt; }
  .conc-ref { color: #333; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
