import { MarkedSegment } from "@/types/scripture";
import { TokenizationOptions } from "@/types/scripture";

function normalizeForLookup(token: string, opts: TokenizationOptions): string {
  let t = token.toLowerCase();
  if (opts.contractionsAsSingle) {
    t = t.replace(/[^a-z0-9'-]/g, "");
  } else {
    t = t.replace(/[^a-z0-9]/g, "");
  }
  if (!opts.includePossessives) {
    t = t.replace(/'s$/, "");
  }
  return t;
}

function getWordTokens(text: string, opts: TokenizationOptions): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Splits verse text into segments with unique-word and unique-phrase flags.
 * Strategy:
 * 1. Find all phrase spans (3-word first, then 2-word) that are unique.
 * 2. Mark words as unique if not already inside a phrase span.
 * 3. Emit segments in order.
 */
export function markupVerse(
  text: string,
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  opts: TokenizationOptions,
  includeUniqueWords: boolean,
  includeUniquePhrases: boolean
): MarkedSegment[] {
  const rawWords = getWordTokens(text, opts);
  if (rawWords.length === 0) return [{ text, isUniqueWord: false, isUniquePhrase: false }];

  const normalized = rawWords.map((w) => normalizeForLookup(w, opts));
  const n = rawWords.length;

  // phraseSpans[i] = length (2 or 3) if a unique phrase starts at index i, else 0
  // We prefer longer phrases.
  const phraseSpans: number[] = new Array(n).fill(0);

  if (includeUniquePhrases) {
    // 3-word phrases first
    if (opts.analyzeThreeWordPhrases ?? true) {
      for (let i = 0; i + 2 < n; i++) {
        const p = `${normalized[i]} ${normalized[i + 1]} ${normalized[i + 2]}`;
        if (uniquePhrases.has(p)) {
          // mark all three positions, but track span start
          if (phraseSpans[i] < 3) phraseSpans[i] = 3;
        }
      }
    }
    // 2-word phrases, only where not already covered by a 3-word span
    if (opts.analyzeTwoWordPhrases ?? true) {
      for (let i = 0; i + 1 < n; i++) {
        const p = `${normalized[i]} ${normalized[i + 1]}`;
        if (uniquePhrases.has(p) && phraseSpans[i] === 0) {
          phraseSpans[i] = 2;
        }
      }
    }
  }

  const segments: MarkedSegment[] = [];
  let i = 0;
  while (i < n) {
    const spanLen = phraseSpans[i];
    if (spanLen > 0) {
      const phraseWords = rawWords.slice(i, i + spanLen).join(" ");
      segments.push({ text: phraseWords, isUniqueWord: false, isUniquePhrase: true });
      i += spanLen;
    } else {
      const isUnique = includeUniqueWords && uniqueWords.has(normalized[i]);
      segments.push({ text: rawWords[i], isUniqueWord: isUnique, isUniquePhrase: false });
      i++;
    }
  }

  // Re-join with spaces, preserving them
  // But we also need to check: is a word inside a phrase AND unique?
  // For words inside phrases, check each word token.
  const finalSegments: MarkedSegment[] = [];
  for (const seg of segments) {
    if (seg.isUniquePhrase && includeUniqueWords) {
      // Each word in phrase may also be unique
      const words = seg.text.split(" ");
      const normed = words.map((w) => normalizeForLookup(w, opts));
      finalSegments.push({
        text: seg.text,
        isUniqueWord: normed.some((nw) => uniqueWords.has(nw)),
        isUniquePhrase: true,
      });
    } else {
      finalSegments.push(seg);
    }
  }

  return finalSegments;
}
