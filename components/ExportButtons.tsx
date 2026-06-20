"use client";

import { AnalysisResult, TokenizationOptions, DisplayOptions } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";

interface Props {
  result: AnalysisResult;
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
}

export default function ExportButtons({ result, tokenOpts, displayOpts }: Props) {
  const { verses, uniqueWords, uniquePhrases } = result;

  async function handleDocx() {
    const { exportToDocx } = await import("@/lib/exportDocx");
    const blob = await exportToDocx(
      verses,
      uniqueWords,
      uniquePhrases,
      tokenOpts,
      tokenOpts.includeUniqueWords,
      tokenOpts.includeUniquePhrases,
      displayOpts.includeSectionHeadings
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scripture-markup.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleHTML() {
    const book = verses[0]?.book ?? "Scripture";
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${book} - Bible Quizzing Markup</title>
<style>
  body { font-family: ${displayOpts.fontFamily}; font-size: ${displayOpts.fontSize}px; line-height: ${displayOpts.lineSpacing}; max-width: 800px; margin: 0 auto; padding: 2rem; }
  h1.book-title { font-size: 2em; margin-top: 2rem; }
  h2.chapter-heading { font-size: 1.5em; margin-top: 1.5rem; }
  h3.section-heading { font-size: 1.1em; font-style: italic; margin-top: 1rem; color: #555; }
  .verse-number { font-size: 0.75em; color: #888; margin-right: 0.25em; vertical-align: super; }
  .verse-line { margin: 0.2em 0; }
  .unique-word { font-weight: bold; }
  .unique-phrase { text-decoration: underline; }
</style>
</head>
<body>\n`;

    let currentBook = "";
    let currentChapter = -1;
    let lastHeading = "";

    for (const verse of verses) {
      if (verse.book !== currentBook) {
        currentBook = verse.book;
        html += `<h1 class="book-title">${esc(verse.book)}</h1>\n`;
      }
      if (verse.chapter !== currentChapter) {
        currentChapter = verse.chapter;
        html += `<h2 class="chapter-heading">Chapter ${verse.chapter}</h2>\n`;
      }
      if (displayOpts.includeSectionHeadings && verse.sectionHeading && verse.sectionHeading !== lastHeading) {
        lastHeading = verse.sectionHeading;
        html += `<h3 class="section-heading">${esc(verse.sectionHeading)}</h3>\n`;
      }

      const segments = markupVerse(verse.text, uniqueWords, uniquePhrases, tokenOpts, tokenOpts.includeUniqueWords, tokenOpts.includeUniquePhrases);
      html += `<p class="verse-line"><sup class="verse-number">${verse.verse}</sup>`;
      for (const seg of segments) {
        const classes = [seg.isUniqueWord ? "unique-word" : "", seg.isUniquePhrase ? "unique-phrase" : ""].filter(Boolean).join(" ");
        if (classes) {
          html += `<span class="${classes}">${esc(seg.text)} </span>`;
        } else {
          html += esc(seg.text) + " ";
        }
      }
      html += `</p>\n`;
    }

    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scripture-markup.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (verses.length === 0) return null;

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={handleDocx}
        className="bg-green-600 text-white px-5 py-2 rounded text-sm hover:bg-green-700 transition-colors"
      >
        Export DOCX
      </button>
      <button
        onClick={handleHTML}
        className="bg-indigo-600 text-white px-5 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
      >
        Export HTML
      </button>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
