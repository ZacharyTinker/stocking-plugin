import { Verse, TokenizationOptions, AnalysisResult } from "@/types/scripture";

function normalizeToken(token: string, opts: TokenizationOptions): string {
  let t = token.toLowerCase();
  // Normalize Unicode apostrophes (curly/smart quotes from API text) to ASCII apostrophe
  // so that "judge's" (U+2019) and "judge's" (U+0027) are treated identically.
  t = t.replace(/[‘’ʼ]/g, "'");
  // Remove surrounding punctuation (keep apostrophes inside if contractions enabled)
  if (opts.contractionsAsSingle) {
    t = t.replace(/[^a-z0-9'-]/g, "");
  } else {
    t = t.replace(/[^a-z0-9]/g, "");
  }
  if (!opts.includePossessives) {
    t = t.replace(/'s$/, "");
    t = t.replace(/'+$/g, "");  // also strip plural possessive trailing apostrophe
  }
  // Always strip leading apostrophes (opening quote marks like U+2018)
  t = t.replace(/^'+/, "");
  return t;
}

function tokenize(text: string, opts: TokenizationOptions): string[] {
  // Split on whitespace, then handle hyphens
  const rawTokens = text.split(/\s+/);
  const tokens: string[] = [];
  for (const raw of rawTokens) {
    // Em/en dashes are always word-separators (typographic, not word-connectors like hyphens)
    const emDashParts = raw.split(/[–—]/);
    for (const emPart of emDashParts) {
      if (opts.hyphenatedWordsAsSingle) {
        const t = normalizeToken(emPart, opts);
        if (t) tokens.push(t);
      } else {
        for (const p of emPart.split("-")) {
          const t = normalizeToken(p, opts);
          if (t) tokens.push(t);
        }
      }
    }
  }
  return tokens;
}

export function analyzeVerses(verses: Verse[], opts: TokenizationOptions): AnalysisResult {
  // Build verse id → tokens map
  const verseTokens: Map<string, string[]> = new Map();
  for (const v of verses) {
    const id = `${v.book} ${v.chapter}:${v.verse}`;
    verseTokens.set(id, tokenize(v.text, opts));
  }

  // Word index: normalized word → set of verse ids
  const wordIndex: Map<string, Set<string>> = new Map();
  for (const [id, tokens] of verseTokens) {
    const seen = new Set<string>();
    for (const t of tokens) {
      if (!t || seen.has(t)) continue;
      seen.add(t);
      if (!wordIndex.has(t)) wordIndex.set(t, new Set());
      wordIndex.get(t)!.add(id);
    }
  }

  // Phrase index: normalized phrase → set of verse ids
  const phraseIndex: Map<string, Set<string>> = new Map();
  for (const [id, tokens] of verseTokens) {
    const addPhrase = (phrase: string) => {
      if (!phraseIndex.has(phrase)) phraseIndex.set(phrase, new Set());
      phraseIndex.get(phrase)!.add(id);
    };
    const seenPhrases = new Set<string>();
    for (let i = 0; i < tokens.length; i++) {
      if (opts.analyzeTwoWordPhrases && i + 1 < tokens.length) {
        const p = `${tokens[i]} ${tokens[i + 1]}`;
        if (!seenPhrases.has(p)) { seenPhrases.add(p); addPhrase(p); }
      }
      if (opts.analyzeThreeWordPhrases && i + 2 < tokens.length) {
        const p = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
        if (!seenPhrases.has(p)) { seenPhrases.add(p); addPhrase(p); }
      }
    }
  }

  const uniqueWords = new Set<string>();
  for (const [word, ids] of wordIndex) {
    if (ids.size === 1) uniqueWords.add(word);
  }

  const uniquePhrases = new Set<string>();
  for (const [phrase, ids] of phraseIndex) {
    if (ids.size === 1) uniquePhrases.add(phrase);
  }

  // Word frequency: total occurrences (not deduplicated per verse)
  const wordFrequency = new Map<string, number>();
  for (const tokens of verseTokens.values()) {
    for (const t of tokens) {
      if (t) wordFrequency.set(t, (wordFrequency.get(t) ?? 0) + 1);
    }
  }

  return { verses, uniqueWords, uniquePhrases, wordFrequency };
}
