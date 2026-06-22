"use client";

import { Verse, TokenizationOptions, DisplayOptions, AnalysisResult, MarkupStyle, ElementStyle, ClubStyle } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";
import { IndicatorDemo } from "@/components/ClubStylePicker";

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
  keyVerses?: Map<string, string>;
  clubStyles?: Record<string, ClubStyle>;
}

export default function Preview({ result, tokenOpts, displayOpts, keyVerses, clubStyles }: Props) {
  const { verses, uniqueWords, uniquePhrases } = result;

  let currentBook = "";
  let currentChapter = -1;
  let lastHeading = "";

  const elements: React.ReactNode[] = [];

  const { bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle } = displayOpts;
  const paragraphMode = displayOpts.verseLayout === "paragraph";

  // Buffer of inline verse nodes for the current paragraph (paragraph mode only)
  let paraBuffer: React.ReactNode[] = [];
  let paraKey = "";
  function flushParagraph() {
    if (paraBuffer.length === 0) return;
    elements.push(
      <p key={`para-${paraKey}`} className="verse-paragraph my-1" style={{ textAlign: "justify" }}>
        {paraBuffer}
      </p>
    );
    paraBuffer = [];
  }

  function renderVerseInline(verse: Verse): React.ReactNode {
    const segments = markupVerse(
      verse.text, uniqueWords, uniquePhrases, tokenOpts,
      tokenOpts.includeUniqueWords, tokenOpts.includeUniquePhrases
    );

    const verseId = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const club = keyVerses?.get(verseId);
    const clubStyle = club ? clubStyles?.[club] : undefined;

    return (
      <span key={`v-${verseId}`}>
        {/* Verse number: plain or with club indicator */}
        {clubStyle && clubStyle.indicator !== "none" ? (
          <span className="select-none" style={{ marginRight: "0.25em" }}>
            <IndicatorDemo verseNum={verse.verse} clubStyle={clubStyle} verseNumberStyle={verseNumberStyle} />
          </span>
        ) : verseNumberStyle.superscript === false ? (
          <span
            className="verse-number select-none"
            style={{ ...elementStyleToCSS(verseNumberStyle), marginRight: "0.3em" }}
          >
            {verse.verse}
          </span>
        ) : (
          <sup
            className="verse-number select-none"
            style={{ ...elementStyleToCSS(verseNumberStyle), marginRight: "0.2em", verticalAlign: "super" }}
          >
            {verse.verse}
          </sup>
        )}
        {segments.map((seg, i) => {
          let style: React.CSSProperties = {};
          if (seg.isUniquePhrase) {
            const phraseStyle = seg.phraseLen === 3 ? displayOpts.phrase3Style : displayOpts.phrase2Style;
            style = { ...style, ...markupStyleToCSS(phraseStyle, displayOpts.fontSize) };
          }
          if (seg.isUniqueWord)   style = { ...style, ...markupStyleToCSS(displayOpts.wordStyle, displayOpts.fontSize) };
          const cls = [seg.isUniqueWord ? "unique-word" : "", seg.isUniquePhrase ? "unique-phrase" : ""].filter(Boolean).join(" ");
          return (
            <span key={i} className={cls || undefined} style={Object.keys(style).length ? style : undefined}>
              {seg.text}{" "}
            </span>
          );
        })}
      </span>
    );
  }

  // Optional legend, ordered by rank, so the reader understands the club hierarchy
  if (clubStyles && Object.keys(clubStyles).length > 0 && keyVerses && keyVerses.size > 0) {
    const ordered = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);
    elements.push(
      <div key="club-legend" className="club-legend mb-4 flex flex-wrap gap-4 items-center text-sm border rounded p-2 bg-gray-50">
        <span className="text-gray-500 font-medium">Key:</span>
        {ordered.map(([club, style]) => (
          <span key={club} className="inline-flex items-center gap-1">
            {style.indicator !== "none" && (
              <IndicatorDemo verseNum={" "} clubStyle={style} verseNumberStyle={{ ...verseNumberStyle, superscript: false }} />
            )}
            <span>{club}</span>
          </span>
        ))}
      </div>
    );
  }

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      flushParagraph();
      currentBook = verse.book;
      elements.push(
        <h1 key={`book-${verse.book}`} className="mt-8 mb-2 book-title" style={elementStyleToCSS(bookTitleStyle)}>
          {verse.book}
        </h1>
      );
    }

    if (verse.chapter !== currentChapter) {
      flushParagraph();
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
      flushParagraph();
      lastHeading = verse.sectionHeading;
      elements.push(
        <h3 key={`sec-${verse.book}-${verse.chapter}-${verse.verse}`} className="mt-4 mb-0.5 section-heading" style={elementStyleToCSS(sectionHeadingStyle)}>
          {verse.sectionHeading}
        </h3>
      );
    }

    if (paragraphMode) {
      if (paraBuffer.length === 0) paraKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      paraBuffer.push(renderVerseInline(verse));
    } else {
      elements.push(
        <p key={`v-${verse.book}-${verse.chapter}-${verse.verse}`} className="verse-line my-0.5">
          {renderVerseInline(verse)}
        </p>
      );
    }
  }
  flushParagraph();

  return (
    <div
      className="p-6 bg-white border rounded shadow-sm min-h-[400px] preview-area"
      style={{ fontFamily: displayOpts.fontFamily, fontSize: displayOpts.fontSize, lineHeight: displayOpts.lineSpacing }}
    >
      {elements.length === 0 ? (
        <p className="text-gray-400 text-sm">Preview will appear here after parsing.</p>
      ) : (
        elements
      )}
    </div>
  );
}
