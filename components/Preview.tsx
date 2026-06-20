"use client";

import { Verse, TokenizationOptions, DisplayOptions, AnalysisResult } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";

interface Props {
  result: AnalysisResult;
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
}

export default function Preview({ result, tokenOpts, displayOpts }: Props) {
  const { verses, uniqueWords, uniquePhrases } = result;

  let currentBook = "";
  let currentChapter = -1;
  let lastHeading = "";

  const elements: React.ReactNode[] = [];

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      elements.push(
        <h1 key={`book-${verse.book}`} className="text-2xl font-bold mt-8 mb-2 book-title">
          {verse.book}
        </h1>
      );
    }

    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      elements.push(
        <h2 key={`ch-${verse.book}-${verse.chapter}`} className="text-xl font-semibold mt-6 mb-1 chapter-heading">
          Chapter {verse.chapter}
        </h2>
      );
    }

    if (
      displayOpts.includeSectionHeadings &&
      verse.sectionHeading &&
      verse.sectionHeading !== lastHeading
    ) {
      lastHeading = verse.sectionHeading;
      elements.push(
        <h3 key={`sec-${verse.book}-${verse.chapter}-${verse.verse}`} className="text-base font-semibold italic mt-4 mb-0.5 section-heading text-gray-700">
          {verse.sectionHeading}
        </h3>
      );
    }

    const segments = markupVerse(
      verse.text,
      uniqueWords,
      uniquePhrases,
      tokenOpts,
      tokenOpts.includeUniqueWords,
      tokenOpts.includeUniquePhrases
    );

    elements.push(
      <p key={`v-${verse.book}-${verse.chapter}-${verse.verse}`} className="verse-line my-0.5">
        <span className="verse-number text-xs text-gray-500 mr-1 select-none">{verse.verse}</span>
        {segments.map((seg, i) => {
          const cls = [
            seg.isUniqueWord ? "unique-word font-bold" : "",
            seg.isUniquePhrase ? "unique-phrase underline" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={i} className={cls || undefined}>
              {seg.text}{" "}
            </span>
          );
        })}
      </p>
    );
  }

  return (
    <div
      className="p-6 bg-white border rounded shadow-sm min-h-[400px] preview-area"
      style={{
        fontFamily: displayOpts.fontFamily,
        fontSize: displayOpts.fontSize,
        lineHeight: displayOpts.lineSpacing,
      }}
    >
      {elements.length === 0 ? (
        <p className="text-gray-400 text-sm">Preview will appear here after parsing.</p>
      ) : (
        elements
      )}
    </div>
  );
}
