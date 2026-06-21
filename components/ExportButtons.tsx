"use client";

import { AnalysisResult, TokenizationOptions, DisplayOptions, ClubStyle } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";
import { indicatorChar } from "@/components/ClubStylePicker";

interface Props {
  result: AnalysisResult;
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
  keyVerses?: Map<string, string>;
  clubStyles?: Record<string, ClubStyle>;
}

export default function ExportButtons({ result, tokenOpts, displayOpts, keyVerses, clubStyles }: Props) {
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
      displayOpts,
      keyVerses,
      clubStyles
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scripture-markup.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleHTML() {
    const { wordStyle, phraseStyle, fontSize,
            bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle,
            chapterPageBreak } = displayOpts;

    function markupAttr(s: typeof wordStyle): string {
      const parts: string[] = [];
      if (s.bold) parts.push("font-weight:bold");
      if (s.italic) parts.push("font-style:italic");
      if (s.underline) parts.push("text-decoration:underline");
      if (s.highlight) parts.push(`background-color:${s.highlight}`);
      if (s.color) parts.push(`color:${s.color}`);
      if (s.sizeBoost) parts.push(`font-size:${fontSize + s.sizeBoost}px`);
      return parts.join(";");
    }

    function elementAttr(s: typeof bookTitleStyle): string {
      const parts: string[] = [];
      parts.push(`font-size:${s.fontSize}px`);
      parts.push(`font-weight:${s.bold ? "bold" : "normal"}`);
      parts.push(`font-style:${s.italic ? "italic" : "normal"}`);
      if (s.underline) parts.push("text-decoration:underline");
      if (s.highlight) parts.push(`background-color:${s.highlight}`);
      if (s.color) parts.push(`color:${s.color}`);
      return parts.join(";");
    }

    function segStyle(seg: { isUniqueWord: boolean; isUniquePhrase: boolean }): string {
      const parts: string[] = [];
      if (seg.isUniquePhrase) parts.push(markupAttr(phraseStyle));
      if (seg.isUniqueWord) parts.push(markupAttr(wordStyle));
      return parts.filter(Boolean).join(";");
    }

    const book = verses[0]?.book ?? "Scripture";
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${book} - Bible Quizzing Markup</title>
<style>
  body { font-family: ${displayOpts.fontFamily}; font-size: ${fontSize}px; line-height: ${displayOpts.lineSpacing}; max-width: 800px; margin: 0 auto; padding: 2rem; }
  h1.book-title { margin-top: 2rem; ${elementAttr(bookTitleStyle)} }
  h2.chapter-heading { margin-top: 1.5rem; ${elementAttr(chapterHeadingStyle)}${chapterPageBreak ? " page-break-before:always;" : ""} }
  h3.section-heading { margin-top: 1rem; ${elementAttr(sectionHeadingStyle)} }
  .verse-number { ${elementAttr(verseNumberStyle)} margin-right: 0.25em; vertical-align: super; }
  .verse-line { margin: 0.2em 0; }
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
      const verseId = `${verse.book} ${verse.chapter}:${verse.verse}`;
      const club = keyVerses?.get(verseId);
      const cs = club ? clubStyles?.[club] : undefined;

      let verseNumHtml: string;
      if (cs && cs.indicator !== "none") {
        if (cs.indicator === "dot") {
          verseNumHtml = `<span style="color:${cs.color};font-size:0.55em;vertical-align:super;margin-right:0.1em">•</span><sup class="verse-number">${verse.verse}</sup>`;
        } else {
          const bg = cs.indicator === "filled" ? `background:${cs.color};color:white` : `border:1.5px solid ${cs.color};color:#555`;
          verseNumHtml = `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:1.6em;height:1.6em;border-radius:50%;${bg};font-size:${verseNumberStyle.fontSize}px;vertical-align:super;line-height:1;margin-right:0.2em">${verse.verse}</span>`;
        }
      } else {
        verseNumHtml = `<sup class="verse-number">${verse.verse}</sup>`;
      }
      html += `<p class="verse-line">${verseNumHtml}`;
      for (const seg of segments) {
        const inlineStyle = segStyle(seg);
        if (inlineStyle) {
          html += `<span style="${inlineStyle}">${esc(seg.text)} </span>`;
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

  async function handleStudyCards() {
    const { exportStudyCards } = await import("@/lib/exportStudyCards");
    exportStudyCards(verses, uniqueWords, uniquePhrases, tokenOpts, displayOpts);
  }

  function handlePrint() {
    window.print();
  }

  if (verses.length === 0) return null;

  return (
    <div className="flex gap-3 flex-wrap no-print">
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
      <button
        onClick={handleStudyCards}
        className="bg-purple-600 text-white px-5 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
      >
        Study Cards
      </button>
      <button
        onClick={handlePrint}
        className="border px-5 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Print
      </button>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
