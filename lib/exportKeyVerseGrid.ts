import { Verse, ClubStyle } from "@/types/scripture";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function exportKeyVerseGrid(
  verses: Verse[],
  keyVerses: Map<string, string>,
  clubStyles: Record<string, ClubStyle>,
  passageTitle: string
): void {
  const book = verses[0]?.book ?? "";

  // Group key verses by chapter
  const byChapter = new Map<number, { verse: number; club: string }[]>();
  for (const [verseId, club] of keyVerses) {
    // verseId: "John 13:5"
    const match = verseId.match(/(\d+):(\d+)$/);
    if (!match) continue;
    const ch = parseInt(match[1], 10);
    const vn = parseInt(match[2], 10);
    if (!byChapter.has(ch)) byChapter.set(ch, []);
    byChapter.get(ch)!.push({ verse: vn, club });
  }

  // Sort clubs by rank for legend
  const orderedClubs = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);

  // Legend
  const legendItems = orderedClubs.map(([club, cs]) => {
    const char = cs.indicator === "filled" ? "●" : cs.indicator === "outline" ? "○" : cs.indicator === "dot" ? "•" : "";
    const color = cs.color || "#555";
    let ind = "";
    if (cs.indicator === "dot") {
      ind = `<span style="color:${color};font-size:11pt;margin-right:2px">${char}</span>`;
    } else if (cs.indicator !== "none") {
      const bg = cs.indicator === "filled"
        ? `background:${color};color:white;border:1px solid ${color}`
        : `border:1.5px solid ${color};color:#555`;
      ind = `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;${bg};font-size:7pt;margin-right:2px">&nbsp;</span>`;
    }
    return `<span style="display:inline-flex;align-items:center;margin-right:12px">${ind}${esc(club)}</span>`;
  }).join("");

  // Build grid rows
  const chapters = [...byChapter.keys()].sort((a, b) => a - b);
  let gridRows = "";

  for (const ch of chapters) {
    const entries = byChapter.get(ch)!.sort((a, b) => a.verse - b.verse);
    const cells = entries.map(({ verse, club }) => {
      const cs = clubStyles[club];
      if (!cs) return `<span class="vn plain">${verse}</span>`;
      if (cs.indicator === "filled") {
        return `<span class="vn filled" style="background:${cs.color};color:white;border-color:${cs.color}">${verse}</span>`;
      } else if (cs.indicator === "outline") {
        return `<span class="vn outline" style="border-color:${cs.color};color:${cs.color}">${verse}</span>`;
      } else if (cs.indicator === "dot") {
        return `<span class="vn dot"><span style="color:${cs.color};font-size:0.65em;vertical-align:super">●</span>${verse}</span>`;
      }
      return `<span class="vn plain">${verse}</span>`;
    }).join("");
    gridRows += `<tr><td class="ch-num">${ch}</td><td class="ch-verses">${cells}</td></tr>\n`;
  }

  const totalKeyVerses = keyVerses.size;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Key Verses — ${esc(passageTitle)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; margin: 0.5in; }
  h1 { font-size: 14pt; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 9pt; text-align: center; color: #555; margin-top: 0; margin-bottom: 10px; }
  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; border: 1px solid #ccc; padding: 5px 8px; margin-bottom: 10px; font-size: 8.5pt; border-radius: 3px; background: #f9f9f9; }
  table { border-collapse: collapse; }
  td { padding: 2px 4px; vertical-align: middle; }
  td.ch-num { font-weight: bold; width: 24px; text-align: right; padding-right: 6px; border-right: 2px solid #333; }
  td.ch-verses { padding-left: 6px; }
  .vn { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; border: 1.5px solid #333; margin: 1px; font-size: 7.5pt; font-weight: bold; padding: 0 2px; }
  .vn.filled { border-radius: 3px; }
  .vn.outline { border-radius: 50%; }
  .vn.dot { border: 1px solid #ccc; border-radius: 3px; }
  .vn.plain { border: 1px dashed #aaa; color: #888; border-radius: 3px; }
  .book-label { display: inline-block; font-weight: bold; font-size: 11pt; border: 2px solid #333; padding: 2px 8px; margin-bottom: 8px; }
</style>
</head>
<body>
<h1>Key Verses</h1>
<h2>${esc(passageTitle)} &mdash; ${totalKeyVerses} verses</h2>
<div class="legend">${legendItems}</div>
<div class="book-label">${esc(book)}</div>
<table>
${gridRows}
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Key Verse Grid.html`;
  a.click();
  URL.revokeObjectURL(url);
}
