import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { Verse, MarkedSegment, TokenizationOptions, MarkupStyle, DisplayOptions } from "@/types/scripture";
import { markupVerse } from "./markup";

function hexToShading(hex: string): string {
  // DOCX shading colors are 6-char hex without '#'
  return hex.replace("#", "").toUpperCase();
}

function segmentsToRuns(
  verseNumber: number,
  segments: MarkedSegment[],
  wordStyle: MarkupStyle,
  phraseStyle: MarkupStyle,
  baseSizePt: number
): TextRun[] {
  const runs: TextRun[] = [
    new TextRun({ text: `${verseNumber}`, bold: false, superScript: true, size: 16, color: "888888" }),
    new TextRun({ text: " " }),
  ];
  for (const seg of segments) {
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

export async function exportToDocx(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  opts: TokenizationOptions,
  includeUniqueWords: boolean,
  includeUniquePhrases: boolean,
  displayOpts: DisplayOptions
): Promise<Blob> {
  const { includeSectionHeadings, wordStyle, phraseStyle, fontSize } = displayOpts;
  const paragraphs: Paragraph[] = [];

  let currentBook = "";
  let currentChapter = -1;
  let lastHeading = "";

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      paragraphs.push(
        new Paragraph({
          text: verse.book,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    }

    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      paragraphs.push(
        new Paragraph({
          text: `Chapter ${verse.chapter}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
        })
      );
    }

    if (includeSectionHeadings && verse.sectionHeading && verse.sectionHeading !== lastHeading) {
      lastHeading = verse.sectionHeading;
      paragraphs.push(
        new Paragraph({
          text: verse.sectionHeading,
          heading: HeadingLevel.HEADING_3,
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

    paragraphs.push(
      new Paragraph({
        children: segmentsToRuns(verse.verse, segments, wordStyle, phraseStyle, fontSize),
        spacing: { after: 60 },
      })
    );
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 32 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 26 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, italics: true, size: 22 },
        },
      ],
    },
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBlob(doc);
}
