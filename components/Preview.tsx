"use client";

import { Verse, TokenizationOptions, DisplayOptions, AnalysisResult, MarkupStyle, ElementStyle } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";

function markupStyleToCSS(s: MarkupStyle, baseFontSize: number): React.CSSProperties {
  return {
    fontWeight: s.bold ? "bold" : undefined,
    fontStyle: s.italic ? "italic" : undefined,
    textDecoration: s.underline ? "underline" : undefined,
    backgroundColor: s.highlight || undefined,
    color: s.color || undefined,
    fontSize: s.sizeBoost ? `${baseFontSize + s.sizeBoost}px` : undefined,
  };
}

function elementStyleToCSS(s: ElementStyle): React.CSSProperties {
  return {
    fontWeight: s.bold ? "bold" : "normal",
    fontStyle: s.italic ? "italic" : "normal",
    textDecoration: s.underline ? "underline" : undefined,
    backgroundColor: s.highlight || undefined,
    color: s.color || undefined,
    fontSize: `${s.fontSize}px`,
  };
}

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

  const { bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle } = displayOpts;

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      elements.push(
        <h1 key={`book-${verse.book}`} className="mt-8 mb-2 book-title" style={elementStyleToCSS(bookTitleStyle)}>
          {verse.book}
        </h1>
      );
    }

    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      elements.push(
        <h2 key={`ch-${verse.book}-${verse.chapter}`} className="mt-6 mb-1 chapter-heading" style={elementStyleToCSS(chapterHeadingStyle)}>
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
        <h3 key={`sec-${verse.book}-${verse.chapter}-${verse.verse}`} className="mt-4 mb-0.5 section-heading" style={elementStyleToCSS(sectionHeadingStyle)}>
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
        <sup
          className="verse-number select-none"
          style={{ ...elementStyleToCSS(verseNumberStyle), marginRight: "0.2em", verticalAlign: "super" }}
        >
          {verse.verse}
        </sup>
        {segments.map((seg, i) => {
          let style: React.CSSProperties = {};
          if (seg.isUniquePhrase) {
            style = { ...style, ...markupStyleToCSS(displayOpts.phraseStyle, displayOpts.fontSize) };
          }
          if (seg.isUniqueWord) {
            style = { ...style, ...markupStyleToCSS(displayOpts.wordStyle, displayOpts.fontSize) };
          }
          const cls = [
            seg.isUniqueWord ? "unique-word" : "",
            seg.isUniquePhrase ? "unique-phrase" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={i} className={cls || undefined} style={Object.keys(style).length ? style : undefined}>
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
