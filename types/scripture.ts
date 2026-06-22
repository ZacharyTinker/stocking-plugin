export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  sectionHeading?: string;
  text: string;
}

export interface TokenizationOptions {
  hyphenatedWordsAsSingle: boolean;
  contractionsAsSingle: boolean;
  includePossessives: boolean;
  analyzeTwoWordPhrases: boolean;
  analyzeThreeWordPhrases: boolean;
  includeUniqueWords: boolean;
  includeUniquePhrases: boolean;
}

export interface MarkupStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** CSS background color string, e.g. "#ffff00" or "" for none */
  highlight: string;
  /** CSS text color string, e.g. "#cc0000" or "" for inherit */
  color: string;
  /** Extra font-size boost in px (0 = no change) */
  sizeBoost: number;
}

/** Style for structural elements (headings, verse numbers) — uses absolute font size */
export interface ElementStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlight: string;
  color: string;
  /** Absolute font size in px */
  fontSize: number;
  /** Render as superscript (only meaningful for verse numbers; defaults to true) */
  superscript?: boolean;
}

export interface DisplayOptions {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  includeSectionHeadings: boolean;
  includeFootnotes: boolean;
  wordStyle: MarkupStyle;
  /** Style for unique 2-word phrases */
  phrase2Style: MarkupStyle;
  /** Style for unique 3-word phrases */
  phrase3Style: MarkupStyle;
  bookTitleStyle: ElementStyle;
  chapterHeadingStyle: ElementStyle;
  sectionHeadingStyle: ElementStyle;
  verseNumberStyle: ElementStyle;
  /** Insert a page break before each chapter heading in exports */
  chapterPageBreak: boolean;
}

export interface AnalysisResult {
  verses: Verse[];
  uniqueWords: Set<string>;
  uniquePhrases: Set<string>;
  /** Normalized word → total occurrence count across all verses */
  wordFrequency: Map<string, number>;
}

/** Visual indicator style for a Key Verse club level */
export interface ClubStyle {
  /** "filled" = solid circle, "outline" = ring only, "dot" = small bullet, "none" = hidden */
  indicator: "filled" | "outline" | "dot" | "none";
  color: string;
}

export const DEFAULT_CLUB_STYLES: Record<string, ClubStyle> = {
  "Club 75":  { indicator: "dot",     color: "#94a3b8" },
  "Club 150": { indicator: "filled",  color: "#2563eb" },
  "Club 300": { indicator: "outline", color: "#2563eb" },
};

export const CLUB_COLOR_PALETTE = [
  "#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2",
];

export type TokenKind = 'word' | 'phrase2' | 'phrase3';

export interface MarkedToken {
  text: string;
  isUniqueWord: boolean;
  isUniquePhrase: boolean;
  kind: TokenKind;
}

export interface MarkedSegment {
  text: string;
  isUniqueWord: boolean;
  isUniquePhrase: boolean;
  /** Word count of the phrase span (2 or 3) when isUniquePhrase is true */
  phraseLen?: 2 | 3;
}
