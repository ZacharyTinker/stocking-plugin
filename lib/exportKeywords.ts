import { Verse, TokenizationOptions } from "@/types/scripture";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Abbreviate a book name for compact references, e.g. "John" → "J", "1 Corinthians" → "1 Cor" */
function abbrev(book: string): string {
  const map: Record<string, string> = {
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
  return map[book] ?? book.slice(0, 4);
}

export function exportKeywords(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniqueWordVerses: Map<string, string>,
  passageTitle: string
): void {
  const book = verses[0]?.book ?? "";
  const bookAbbr = abbrev(book);

  // Build rows: word (uppercase) + verse reference
  const rows = [...uniqueWords]
    .sort((a, b) => a.localeCompare(b))
    .map((w) => {
      const verseId = uniqueWordVerses.get(w) ?? "";
      // verseId format: "John 13:5" → want "J 13:5"
      const ref = verseId.replace(book, bookAbbr).trim();
      return { word: w.toUpperCase(), ref };
    });

  // Arrange in 3 columns for print layout
  const perCol = Math.ceil(rows.length / 3);
  const cols: { word: string; ref: string }[][] = [[], [], []];
  rows.forEach((r, i) => cols[Math.floor(i / perCol)].push(r));

  const rowCount = Math.max(...cols.map((c) => c.length));

  let tableRows = "";
  for (let r = 0; r < rowCount; r++) {
    tableRows += "<tr>";
    for (let c = 0; c < 3; c++) {
      const entry = cols[c][r];
      if (entry) {
        tableRows += `<td class="word">${esc(entry.word)}</td><td class="ref">${esc(entry.ref)}</td>`;
      } else {
        tableRows += `<td></td><td></td>`;
      }
    }
    tableRows += "</tr>\n";
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Keywords — ${esc(passageTitle)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; margin: 0.5in; }
  h1 { font-size: 14pt; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 10pt; text-align: center; color: #555; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 4px; vertical-align: top; }
  td.word { font-weight: bold; min-width: 120px; white-space: nowrap; }
  td.ref { color: #444; min-width: 60px; padding-right: 16px; }
</style>
</head>
<body>
<h1>Keywords</h1>
<h2>${esc(passageTitle)} &mdash; ${rows.length} unique words</h2>
<table>
${tableRows}
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Keywords.html`;
  a.click();
  URL.revokeObjectURL(url);
}
