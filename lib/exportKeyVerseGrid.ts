import { Verse, ClubStyle } from "@/types/scripture";
import { wrapAddonHtml } from "./exportKeywords";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function keyVerseGridSection(
  verses: Verse[],
  keyVerses: Map<string, string>,
  clubStyles: Record<string, ClubStyle>,
  passageTitle: string
): string {
  const book = verses[0]?.book ?? "";

  const byChapter = new Map<number, { verse: number; club: string }[]>();
  for (const [verseId, club] of keyVerses) {
    const match = verseId.match(/(\d+):(\d+)$/);
    if (!match) continue;
    const ch = parseInt(match[1], 10);
    const vn = parseInt(match[2], 10);
    if (!byChapter.has(ch)) byChapter.set(ch, []);
    byChapter.get(ch)!.push({ verse: vn, club });
  }

  const orderedClubs = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);

  const legendItems = orderedClubs.map(([club, cs]) => {
    const ind = indicatorHTML(cs, "&nbsp;");
    return `<span style="display:inline-flex;align-items:center;gap:3px">${ind}${esc(club)}</span>`;
  }).join("");

  const chapters = [...byChapter.keys()].sort((a, b) => a - b);
  let gridRows = "";
  for (const ch of chapters) {
    const entries = byChapter.get(ch)!.sort((a, b) => a.verse - b.verse);
    const cells = entries.map(({ verse, club }) => {
      const cs = clubStyles[club];
      if (!cs) return `<span class="kvg-vn" style="border:1px dashed #aaa;color:#999;border-radius:3px">${verse}</span>`;
      return indicatorHTML(cs, String(verse));
    }).join("");
    gridRows += `<tr><td class="kvg-ch">${ch}</td><td class="kvg-verses">${cells}</td></tr>\n`;
  }

  return `<div class="addon-section">
<h2 class="addon-title">Key Verses</h2>
<p class="addon-subtitle">${esc(passageTitle)} &mdash; ${keyVerses.size} verses</p>
<div class="kvg-legend">${legendItems}</div>
<div class="kvg-book">${esc(book)}</div>
<table class="kvg-table"><tbody>
${gridRows}
</tbody></table>
</div>`;
}

/** Renders a verse-number indicator span matching the preview/HTML export style */
function indicatorHTML(cs: ClubStyle, content: string): string {
  if (cs.indicator === "none") {
    return `<span class="kvg-vn" style="border:1px dashed #aaa;color:#999">${content}</span>`;
  }
  const isSquare = cs.indicator === "filled-square" || cs.indicator === "outline-square";
  const isFilled = cs.indicator === "filled" || cs.indicator === "filled-square";
  const radius = isSquare ? "2px" : "50%";
  const bg = isFilled
    ? `background:${cs.color};color:white;border:1.5px solid ${cs.color};border-radius:${radius}`
    : `border:1.5px solid ${cs.color};color:#555;border-radius:${radius}`;
  return `<span class="kvg-vn" style="${bg}">${content}</span>`;
}

export function exportKeyVerseGrid(
  verses: Verse[],
  keyVerses: Map<string, string>,
  clubStyles: Record<string, ClubStyle>,
  passageTitle: string
): void {
  const body = keyVerseGridSection(verses, keyVerses, clubStyles, passageTitle);
  const html = wrapAddonHtml(body, `${passageTitle} — Key Verse Grid`);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${passageTitle} Key Verse Grid.html`;
  a.click();
  URL.revokeObjectURL(url);
}
