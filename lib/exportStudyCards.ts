import { Verse, TokenizationOptions, DisplayOptions, MarkupStyle } from "@/types/scripture";
import { markupVerse } from "./markup";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markupAttr(s: MarkupStyle, baseFontSize: number): string {
  const parts: string[] = [];
  if (s.bold) parts.push("font-weight:bold");
  if (s.italic) parts.push("font-style:italic");
  if (s.underline) parts.push("text-decoration:underline");
  if (s.highlight) parts.push(`background-color:${s.highlight}`);
  if (s.color) parts.push(`color:${s.color}`);
  if (s.sizeBoost) parts.push(`font-size:${baseFontSize + s.sizeBoost}px`);
  return parts.join(";");
}

export function exportStudyCards(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  tokenOpts: TokenizationOptions,
  displayOpts: DisplayOptions
): void {
  const { wordStyle, phrase2Style, phrase3Style, fontSize, fontFamily } = displayOpts;

  function segStyle(seg: { isUniqueWord: boolean; isUniquePhrase: boolean; phraseLen?: 2 | 3 }): string {
    const parts: string[] = [];
    if (seg.isUniquePhrase) parts.push(markupAttr(seg.phraseLen === 3 ? phrase3Style : phrase2Style, fontSize));
    if (seg.isUniqueWord) parts.push(markupAttr(wordStyle, fontSize));
    return parts.filter(Boolean).join(";");
  }

  const cards = verses.map((verse) => {
    const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const segments = markupVerse(
      verse.text, uniqueWords, uniquePhrases, tokenOpts,
      tokenOpts.includeUniqueWords, tokenOpts.includeUniquePhrases
    );

    let text = "";
    for (const seg of segments) {
      const style = segStyle(seg);
      if (style) {
        text += `<span style="${style}">${esc(seg.text)} </span>`;
      } else {
        text += esc(seg.text) + " ";
      }
    }

    return `
      <div class="card">
        <div class="ref">${esc(ref)}</div>
        <div class="text">${text}</div>
      </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Study Cards</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    background: #e0e0e0;
    padding: 0.5in;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 5in);
    gap: 0.25in;
    justify-content: center;
  }

  .card {
    width: 5in;
    min-height: 3in;
    background: white;
    border: 1px dashed #aaa;
    border-radius: 4px;
    padding: 0.3in;
    display: flex;
    flex-direction: column;
    gap: 0.15in;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .ref {
    font-size: ${Math.round(fontSize * 0.8)}px;
    font-weight: bold;
    color: #555;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.1in;
  }

  .text {
    font-size: ${fontSize}px;
    line-height: 1.6;
    flex: 1;
  }

  @media print {
    body { background: white; padding: 0.25in; }
    .grid { gap: 0; }
    .card { border: 1px dashed #ccc; }
  }
</style>
</head>
<body>
<div class="grid">
${cards}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "study-cards.html";
  a.click();
  URL.revokeObjectURL(url);
}
