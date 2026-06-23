import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { Verse, MarkedSegment, TokenizationOptions, MarkupStyle, ElementStyle, DisplayOptions, ClubStyle } from "@/types/scripture";
import { markupVerse } from "./markup";

function hexToShading(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function indicatorChar(cs: ClubStyle): string {
  switch (cs.indicator) {
    case "filled": return "●";
    case "outline": return "○";
    case "filled-square": return "■";
    case "outline-square": return "□";
    default: return "";
  }
}

function clubIndicatorRun(verseNumber: number, clubStyle: ClubStyle, vnHalfPts: number, superScript: boolean, vnColor: string): TextRun[] {
  const char = indicatorChar(clubStyle);
  if (!char) return [];
  const indicatorColor = clubStyle.color.replace("#", "") || "888888";
  const numColor = vnColor.replace("#", "") || "888888";
  return [
    new TextRun({ text: char, superScript, size: vnHalfPts, color: indicatorColor, bold: false }),
    new TextRun({ text: `${verseNumber}`, superScript, size: vnHalfPts, color: numColor, bold: false }),
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
  const vnColor = verseNumberStyle.color || "#888888";

  const verseNumRuns: TextRun[] = clubStyle && clubStyle.indicator !== "none"
    ? clubIndicatorRun(verseNumber, clubStyle, vnHalfPts, superscript, vnColor)
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

    const basePt = Math.round(baseSizePt * 0.75);
    const sizePt = basePt + Math.round(s.sizeBoost * 0.75);

    const space = seg.noSpaceAfter ? "" : " ";
    runs.push(
      new TextRun({
        text: seg.text + space,
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

function sectionHeadingPara(text: string, pageBreak = true): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: "444444" })],
    spacing: { before: pageBreak ? 0 : 400, after: 200 },
    pageBreakBefore: pageBreak,
  });
}

function noBorder() {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b };
}

// ── Addon paragraph generators ────────────────────────────────────────────────

export interface AddonDocxOptions {
  includeKeywords?: boolean;
  includeAlphabetical?: boolean;
  includeKeyPhrases2?: boolean;
  includeKeyPhrases3?: boolean;
  includeKeyVerseGrid?: boolean;
  includeConcordance?: boolean;
  uniqueWords?: Set<string>;
  uniqueWordVerses?: Map<string, string>;
  uniquePhrases?: Set<string>;
  phraseVerseMap?: Map<string, string>;
  keyVerses?: Map<string, string>;
  clubStyles?: Record<string, ClubStyle>;
  wordFrequency?: Map<string, number>;
  wordVerseIndex?: Map<string, string[]>;
}

function keywordsDocx(uniqueWords: Set<string>, uniqueWordVerses: Map<string, string>): Paragraph[] {
  const paras: Paragraph[] = [sectionHeadingPara("Keywords")];
  const sorted = [...uniqueWords].sort();
  for (const word of sorted) {
    const ref = uniqueWordVerses.get(word) ?? "";
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: word, bold: true, size: 20 }),
          new TextRun({ text: "  " + ref, color: "888888", size: 18 }),
        ],
        spacing: { after: 40 },
      })
    );
  }
  return paras;
}

function normWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function alphabeticalDocx(verses: Verse[], uniqueWords: Set<string>): Paragraph[] {
  const paras: Paragraph[] = [sectionHeadingPara("Alphabetical Verse List")];

  const rows: { sortKey: string; display: string; ref: string }[] = [];
  for (const verse of verses) {
    const tokens = verse.text.split(/\s+/).filter(Boolean);
    const displayTokens = tokens.slice(0, 5);
    const display = displayTokens.join(" ") + (tokens.length > 5 ? "…" : "");
    const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const firstNorm = normWord(displayTokens[0] ?? "");
    rows.push({ sortKey: firstNorm, display, ref });
  }
  rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  for (const row of rows) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: row.display + "  ", size: 20 }),
          new TextRun({ text: row.ref, color: "888888", size: 18 }),
        ],
        spacing: { after: 40 },
      })
    );
  }
  return paras;
}

function keyPhrasesDocx(
  verses: Verse[],
  uniquePhrases: Set<string>,
  phraseVerseMap: Map<string, string>,
  include2: boolean,
  include3: boolean
): Paragraph[] {
  const paras: Paragraph[] = [sectionHeadingPara("Key Phrases")];

  const verseOrder = new Map(verses.map((v, i) => [`${v.book} ${v.chapter}:${v.verse}`, i]));

  function buildSection(wordCount: 2 | 3, subTitle: string): Paragraph[] {
    const filtered = [...uniquePhrases].filter(p => p.split(" ").length === wordCount);
    if (filtered.length === 0) return [];
    filtered.sort((a, b) => {
      const ai = verseOrder.get(phraseVerseMap.get(a) ?? "") ?? 9999;
      const bi = verseOrder.get(phraseVerseMap.get(b) ?? "") ?? 9999;
      return ai - bi;
    });
    const out: Paragraph[] = [
      new Paragraph({ children: [new TextRun({ text: subTitle, bold: true, size: 22, color: "5b21b6" })], spacing: { before: 200, after: 80 } }),
    ];
    for (const phrase of filtered) {
      const ref = phraseVerseMap.get(phrase) ?? "";
      out.push(new Paragraph({
        children: [
          new TextRun({ text: phrase, bold: true, size: 20 }),
          new TextRun({ text: "  " + ref, color: "888888", size: 18 }),
        ],
        spacing: { after: 40 },
      }));
    }
    return out;
  }

  if (include2) paras.push(...buildSection(2, "2-Word Phrases"));
  if (include3) paras.push(...buildSection(3, "3-Word Phrases"));
  return paras;
}

function keyVerseGridDocx(
  verses: Verse[],
  keyVerses: Map<string, string>,
  clubStyles: Record<string, ClubStyle>
): Paragraph[] {
  const paras: Paragraph[] = [sectionHeadingPara("Key Verse Grid")];
  const book = verses[0]?.book ?? "";
  paras.push(new Paragraph({ children: [new TextRun({ text: book, bold: true, size: 24 })], spacing: { after: 120 } }));

  const byChapter = new Map<number, { verse: number; club: string }[]>();
  for (const [verseId, club] of keyVerses) {
    const m = verseId.match(/(\d+):(\d+)$/);
    if (!m) continue;
    const ch = parseInt(m[1], 10);
    const vn = parseInt(m[2], 10);
    if (!byChapter.has(ch)) byChapter.set(ch, []);
    byChapter.get(ch)!.push({ verse: vn, club });
  }

  const orderedClubs = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);
  const legendRuns: TextRun[] = [new TextRun({ text: "Key:  ", color: "888888", size: 18 })];
  for (const [club, cs] of orderedClubs) {
    const char = indicatorChar(cs);
    if (char) legendRuns.push(new TextRun({ text: char + " ", color: cs.color.replace("#", "") || "888888", size: 18 }));
    legendRuns.push(new TextRun({ text: `${club}    `, size: 18 }));
  }
  paras.push(new Paragraph({ children: legendRuns, spacing: { after: 160 } }));

  const chapters = [...byChapter.keys()].sort((a, b) => a - b);
  for (const ch of chapters) {
    const entries = byChapter.get(ch)!.sort((a, b) => a.verse - b.verse);
    const runs: TextRun[] = [new TextRun({ text: `Ch ${ch}:  `, bold: true, size: 20 })];
    for (const { verse, club } of entries) {
      const cs = clubStyles[club];
      const char = cs ? indicatorChar(cs) : "";
      if (char) runs.push(new TextRun({ text: char, color: cs.color.replace("#", "") || "888888", size: 20 }));
      runs.push(new TextRun({ text: `${verse}  `, size: 20 }));
    }
    paras.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
  }
  return paras;
}

const SNIPPET_THRESHOLD = 15;

function concordanceDocx(
  verses: Verse[],
  wordFrequency: Map<string, number>,
  wordVerseIndex: Map<string, string[]>
): Paragraph[] {
  const paras: Paragraph[] = [sectionHeadingPara("Concordance")];

  const words = [...wordFrequency.keys()].sort();
  for (const word of words) {
    const count = wordFrequency.get(word) ?? 0;
    const refs = wordVerseIndex.get(word) ?? [];
    const headerRuns: TextRun[] = [
      new TextRun({ text: word, bold: true, size: 20 }),
      new TextRun({ text: `  (${count})`, color: "888888", size: 18 }),
    ];

    if (count > SNIPPET_THRESHOLD) {
      headerRuns.push(new TextRun({ text: "  " + refs.join("; "), color: "888888", size: 17 }));
      paras.push(new Paragraph({ children: headerRuns, spacing: { after: 60 } }));
    } else {
      paras.push(new Paragraph({ children: headerRuns, spacing: { after: 20 } }));
      for (const ref of refs) {
        const verse = verses.find(v => `${v.book} ${v.chapter}:${v.verse}` === ref);
        if (!verse) continue;
        const tokens = verse.text.split(/\s+/);
        for (let i = 0; i < tokens.length; i++) {
          if (normWord(tokens[i]) !== word) continue;
          const ctx = tokens.slice(Math.max(0, i - 3), i + 4).map((t, j) => {
            const pos = i - Math.max(0, i - 3);
            return j === pos ? "♦" : t;
          }).join(" ");
          paras.push(new Paragraph({
            children: [
              new TextRun({ text: `  ${ref}  `, color: "888888", size: 17 }),
              new TextRun({ text: `…${ctx}…`, size: 17 }),
            ],
            spacing: { after: 20 },
          }));
        }
      }
    }
  }
  return paras;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function exportToDocx(
  verses: Verse[],
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  opts: TokenizationOptions,
  includeUniqueWords: boolean,
  includeUniquePhrases: boolean,
  displayOpts: DisplayOptions,
  keyVerses?: Map<string, string>,
  clubStyles?: Record<string, ClubStyle>,
  addons?: AddonDocxOptions
): Promise<Blob> {
  const {
    includeSectionHeadings,
    wordStyle, phrase2Style, phrase3Style, fontSize,
    bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle,
    chapterPageBreak, verseLayout,
  } = displayOpts;
  const paragraphMode = verseLayout === "paragraph";

  const paragraphs: Paragraph[] = [];

  if (clubStyles && Object.keys(clubStyles).length > 0 && keyVerses && keyVerses.size > 0) {
    const ordered = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);
    const legendRuns: TextRun[] = [
      new TextRun({ text: "Key:  ", color: "888888", size: Math.round(fontSize * 0.75) * 2 }),
    ];
    for (const [club, cs] of ordered) {
      const char = indicatorChar(cs);
      const sz = Math.round(fontSize * 0.75) * 2;
      if (char) legendRuns.push(new TextRun({ text: char + " ", color: cs.color.replace("#", "") || "888888", size: sz }));
      legendRuns.push(new TextRun({ text: `${club}    `, size: sz }));
    }
    paragraphs.push(new Paragraph({ children: legendRuns, spacing: { after: 200 } }));
  }

  let currentBook = "";
  let currentChapter = -1;
  let lastHeading = "";
  let paraRuns: TextRun[] = [];

  function flushParaRuns() {
    if (paraRuns.length === 0) return;
    paragraphs.push(new Paragraph({ children: paraRuns, spacing: { after: 120 } }));
    paraRuns = [];
  }

  for (const verse of verses) {
    if (verse.book !== currentBook) {
      flushParaRuns();
      currentBook = verse.book;
      paragraphs.push(new Paragraph({
        children: [elementStyleToRun(verse.book, bookTitleStyle)],
        spacing: { before: 400, after: 200 },
      }));
    }

    if (verse.chapter !== currentChapter) {
      flushParaRuns();
      currentChapter = verse.chapter;
      paragraphs.push(new Paragraph({
        children: [elementStyleToRun(`Chapter ${verse.chapter}`, chapterHeadingStyle)],
        spacing: { before: chapterPageBreak ? 0 : 300, after: 120 },
        pageBreakBefore: chapterPageBreak,
      }));
    }

    if (includeSectionHeadings && verse.sectionHeading && verse.sectionHeading !== lastHeading) {
      flushParaRuns();
      lastHeading = verse.sectionHeading;
      paragraphs.push(new Paragraph({
        children: [elementStyleToRun(verse.sectionHeading, sectionHeadingStyle)],
        spacing: { before: 200, after: 80 },
      }));
    }

    const segments = markupVerse(verse.text, uniqueWords, uniquePhrases, opts, includeUniqueWords, includeUniquePhrases);
    const verseId = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const club = keyVerses?.get(verseId);
    const clubStyle = club ? clubStyles?.[club] : undefined;
    const runs = segmentsToRuns(verse.verse, segments, wordStyle, phrase2Style, phrase3Style, fontSize, verseNumberStyle, clubStyle);

    if (paragraphMode) {
      paraRuns.push(...runs);
    } else {
      paragraphs.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
    }
  }
  flushParaRuns();

  // ── Append addon sections ──────────────────────────────────────────────────
  if (addons) {
    if (addons.includeKeywords && addons.uniqueWords && addons.uniqueWordVerses) {
      paragraphs.push(...keywordsDocx(addons.uniqueWords, addons.uniqueWordVerses));
    }
    if (addons.includeAlphabetical) {
      paragraphs.push(...alphabeticalDocx(verses, addons.uniqueWords ?? new Set()));
    }
    if ((addons.includeKeyPhrases2 || addons.includeKeyPhrases3) && addons.uniquePhrases && addons.phraseVerseMap) {
      paragraphs.push(...keyPhrasesDocx(verses, addons.uniquePhrases, addons.phraseVerseMap, !!addons.includeKeyPhrases2, !!addons.includeKeyPhrases3));
    }
    if (addons.includeKeyVerseGrid && addons.keyVerses && addons.clubStyles && addons.keyVerses.size > 0) {
      paragraphs.push(...keyVerseGridDocx(verses, addons.keyVerses, addons.clubStyles));
    }
    if (addons.includeConcordance && addons.wordFrequency && addons.wordVerseIndex) {
      paragraphs.push(...concordanceDocx(verses, addons.wordFrequency, addons.wordVerseIndex));
    }
  }

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return await Packer.toBlob(doc);
}
