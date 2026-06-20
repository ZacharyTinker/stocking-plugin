import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { Verse } from "@/types/scripture";
import { MarkedSegment } from "@/types/scripture";
import { TokenizationOptions } from "@/types/scripture";
import { analyzeVerses } from "./analyze";
import { markupVerse } from "./markup";

function segmentsToRuns(
  verseNumber: number,
  segments: MarkedSegment[]
): TextRun[] {
  const runs: TextRun[] = [
    new TextRun({ text: `${verseNumber}`, bold: false, superScript: true, size: 16, color: "888888" }),
    new TextRun({ text: " " }),
  ];
  for (const seg of segments) {
    runs.push(
      new TextRun({
        text: seg.text + " ",
        bold: seg.isUniqueWord || (seg.isUniquePhrase && seg.isUniqueWord),
        underline: seg.isUniquePhrase ? {} : undefined,
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
  includeSectionHeadings: boolean
): Promise<Blob> {
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
        children: segmentsToRuns(verse.verse, segments),
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
