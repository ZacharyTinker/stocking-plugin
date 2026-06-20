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

export interface DisplayOptions {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  includeSectionHeadings: boolean;
  includeFootnotes: boolean;
  wordStyle: MarkupStyle;
  phraseStyle: MarkupStyle;
}

export interface AnalysisResult {
  verses: Verse[];
  uniqueWords: Set<string>;
  uniquePhrases: Set<string>;
}

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
}
