import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { Verse, MarkedSegment, TokenizationOptions, MarkupStyle, ElementStyle, DisplayOptions, ClubStyle } from "@/types/scripture";
import { markupVerse } from "./markup";

function hexToShading(hex: string): string {
  // DOCX shading colors are 6-char hex without '#'
  return hex.replace("#", "").toUpperCase();
}

function clubIndicatorRun(verseNumber: number, clubStyle: ClubStyle, vnHalfPts: number): TextRun[] {
  // Use Unicode circle chars as the indicator before the verse number
  const char =
    clubStyle.indicator === "filled"  ? "●" :
    clubStyle.indicator === "outline" ? "○" :
    clubStyle.indicator === "dot"     ? "•" : "";
  if (!char) return [];
  const color = clubStyle.color.replace("#", "") || "888888";
  return [
    new TextRun({ text: char, superScript: true, size: vnHalfPts, color, bold: false }),
    new TextRun({ text: `${verseNumber}`, superScript: true, size: vnHalfPts, color: "888888", bold: false }),
    new TextRun({ text: " " }),
  ];
}

function segmentsToRuns(
  verseNumber: number,
  segments: MarkedSegment[],
  wordStyle: MarkupStyle,
  phrase2Style: MarkupStyle,
  phrase3Style: MarkupStyle,
  baseSizePt: number,
  verseNumberStyle: ElementStyle,
  clubStyle?: ClubStyle
): TextRun[] {
  const vnHalfPts = Math.round(verseNumberStyle.fontSize * 0.75) * 2;
  const superscript = verseNumberStyle.superscript !== false;

  const verseNumRuns: TextRun[] = clubStyle && clubStyle.indicator !== "none"
    ? clubIndicatorRun(verseNumber, clubStyle, vnHalfPts)
    : [
        new TextRun({
          text: `${verseNumber}`,
          superScript: superscript,
          size: vnHalfPts,
          bold: verseNumberStyle.bold,
          italics: verseNumberStyle.italic,
          color: verseNumberStyle.color ? verseNumberStyle.color.replace("#", "") : "888888",
        }),
        new TextRun({ text: " " }),
      ];

  const runs: TextRun[] = [...verseNumRuns];
  for (const seg of segments) {
    const phraseStyle = seg.phraseLen === 3 ? phrase3Style : phrase2Style;
    // Merge styles: phrase first, word on top (word wins for conflicting props)
    const s: MarkupStyle = seg.isUniqueWord
      ? {
          bold: (seg.isUniquePhrase ? phraseStyle.bold : false) || wordStyle.bold,
          italic: (seg.isUniquePhrase ? phraseStyle.italic : false) || wordStyle.italic,
          underline: (seg.isUniquePhrase ? phraseStyle.underline : false) || wordStyle.underline,
          highlight: wordStyle.highlight || (seg.isUniquePhrase ? phraseStyle.highlight : ""),
          color: wordStyle.color || (seg.isUniquePhrase ? phraseStyle.color : ""),
          sizeBoost: wordStyle.sizeBoost || (seg.isUniquePhrase ? phraseStyle.sizeBoost : 0),
        }
      : seg.isUniquePhrase
      ? phraseStyle
      : { bold: false, italic: false, underline: false, highlight: "", color: "", sizeBoost: 0 };

    // DOCX sizes are in half-points; baseSizePt is in px (approx 1px ≈ 0.75pt)
    const basePt = Math.round(baseSizePt * 0.75);
    const sizePt = basePt + Math.round(s.sizeBoost * 0.75);

    runs.push(
      new TextRun({
        text: seg.text + " ",
        bold: s.bold,
        italics: s.italic,
        underline: s.underline ? {} : undefined,
        color: s.color ? s.color.replace("#", "") : undefined,
        shading: s.highlight ? { fill: hexToShading(s.highlight) } : undefined,
        size: s.sizeBoost ? sizePt * 2 : undefined,
      })
    );
  }
  return runs;
}

function elementStyleToRun(text: string, s: ElementStyle): TextRun {
  // DOCX sizes in half-points; fontSize is px ≈ 0.75pt
  const halfPts = Math.round(s.fontSize * 0.75) * 2;
  return new TextRun({
    text,
    bold: s.bold,
    italics: s.italic,
    underline: s.underline ? {} : undefined,
    color: s.color ? s.color.replace("#", "") : undefined,
    shading: s.highlight ? { fill: hexToShading(s.highlight) } : undefined,
    size: halfPts,
  });
}

export async function exportToDocx(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  opts: TokenizationOptions,
  includeUniqueWords: boolean,
  includeUniquePhrases: boolean,
  displayOpts: DisplayOptions,
  keyVerses?: Map<string, string>,
  clubStyles?: Record<string, ClubStyle>
): Promise<Blob> {
  const {
    includeSectionHeadings,
    wordStyle, phrase2Style, phrase3Style, fontSize,
    bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle,
    chapterPageBreak,
  } = displayOpts;

  const paragraphs: Paragraph[] = [];

  let currentBook = "";
  let currentChapter = -1;
  let lastHeading = "";

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      paragraphs.push(
        new Paragraph({
          children: [elementStyleToRun(verse.book, bookTitleStyle)],
          spacing: { before: 400, after: 200 },
        })
      );
    }

    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      paragraphs.push(
        new Paragraph({
          children: [elementStyleToRun(`Chapter ${verse.chapter}`, chapterHeadingStyle)],
          spacing: { before: chapterPageBreak ? 0 : 300, after: 120 },
          pageBreakBefore: chapterPageBreak,
        })
      );
    }

    if (includeSectionHeadings && verse.sectionHeading && verse.sectionHeading !== lastHeading) {
      lastHeading = verse.sectionHeading;
      paragraphs.push(
        new Paragraph({
          children: [elementStyleToRun(verse.sectionHeading, sectionHeadingStyle)],
          spacing: { before: 200, after: 80 },
        })
      );
    }

    const segments = markupVerse(
      verse.text,
      uniqueWords,
      uniquePhrases,
      opts,
      includeUniqueWords,
      includeUniquePhrases
    );

    const verseId = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const club = keyVerses?.get(verseId);
    const clubStyle = club ? clubStyles?.[club] : undefined;

    paragraphs.push(
      new Paragraph({
        children: segmentsToRuns(verse.verse, segments, wordStyle, phrase2Style, phrase3Style, fontSize, verseNumberStyle, clubStyle),
        spacing: { after: 60 },
      })
    );
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBlob(doc);
}
