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

export interface DisplayOptions {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  includeSectionHeadings: boolean;
  includeFootnotes: boolean;
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
