import { Verse, TokenizationOptions, AnalysisResult } from "@/types/scripture";

function normalizeToken(token: string, opts: TokenizationOptions): string {
  let t = token.toLowerCase();

  // Handle Unicode directional quote marks before normalizing them to plain apostrophes.
  // U+2018 ‘ LEFT SINGLE QUOTATION MARK  — always an opening quote, never a word apostrophe.
  // U+2019 ‘ RIGHT SINGLE QUOTATION MARK — closing quote OR possessive/contraction apostrophe.
  // If a leading U+2018 was present, the matching trailing U+2019 is a closing quote (strip it
  // even when it follows ‘s’, e.g. "gods’"). Without a leading U+2018, trailing U+2019 after ‘s’
  // is treated as a genuine plural possessive (e.g. disciples’).
  const hadLeadingCurlyQuote = t.startsWith("‘");
  t = t.replace(/^‘+/, "");
  const trailingCurlyIsPossessive =
    !hadLeadingCurlyQuote && opts.includePossessives && /s’+$/.test(t);
  if (!trailingCurlyIsPossessive) t = t.replace(/’+$/, "");

  // Normalize remaining mid-word Unicode apostrophes (contractions, possessives like judge’s)
  t = t.replace(/[‘’ʼ]/g, "’");

  if (opts.contractionsAsSingle) {
    t = t.replace(/[^a-z0-9’-]/g, "");
  } else {
    t = t.replace(/[^a-z0-9]/g, "");
  }
  if (!opts.includePossessives) {
    t = t.replace(/’s$/, "");
    t = t.replace(/s’+$/, "s");
  }
  t = t.replace(/([^s])’+$/g, "$1");
  t = t.replace(/^’+/, "");
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
  const uniqueWordVerses = new Map<string, string>();
  for (const [word, ids] of wordIndex) {
    if (ids.size === 1) {
      uniqueWords.add(word);
      uniqueWordVerses.set(word, [...ids][0]);
    }
  }

  const uniquePhrases = new Set<string>();
  const phraseVerseMap = new Map<string, string>();
  for (const [phrase, ids] of phraseIndex) {
    if (ids.size === 1) {
      uniquePhrases.add(phrase);
      phraseVerseMap.set(phrase, [...ids][0]);
    }
  }

  const wordVerseIndex = new Map<string, string[]>();
  for (const [word, ids] of wordIndex) {
    wordVerseIndex.set(word, [...ids]);
  }

  // Word frequency: total occurrences (not deduplicated per verse)
  const wordFrequency = new Map<string, number>();
  for (const tokens of verseTokens.values()) {
    for (const t of tokens) {
      if (t) wordFrequency.set(t, (wordFrequency.get(t) ?? 0) + 1);
    }
  }

  return { verses, uniqueWords, uniquePhrases, wordFrequency, uniqueWordVerses, wordVerseIndex, phraseVerseMap };
}
