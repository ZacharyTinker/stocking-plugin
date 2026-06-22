import { MarkedSegment, TokenizationOptions } from "@/types/scripture";

function normalizeForLookup(word: string, opts: TokenizationOptions): string {
  let t = word.toLowerCase();
  const hadLeadingCurlyQuote = t.startsWith("'");
  t = t.replace(/^'+/, "");
  const trailingCurlyIsPossessive =
    !hadLeadingCurlyQuote && opts.includePossessives && /s'+$/.test(t);
  if (!trailingCurlyIsPossessive) t = t.replace(/'+$/, "");
  t = t.replace(/[''ʼ]/g, "'");
  t = opts.contractionsAsSingle ? t.replace(/[^a-z0-9'-]/g, "") : t.replace(/[^a-z0-9]/g, "");
  if (!opts.includePossessives) {
    t = t.replace(/'s$/, "");
    t = t.replace(/s'+$/, "s");
  }
  t = t.replace(/([^s])'+$/g, "$1");
  t = t.replace(/^'+/, "");
  return t;
}

/**
 * Split leading and trailing punctuation off a raw display token, leaving the alphabetic core.
 *   "cutting,"  → { lead: "",   core: "cutting", trail: "," }
 *   ""No"       → { lead: "“", core: "No",  trail: "" }
 *   "clubs?"    → { lead: "",   core: "clubs",   trail: "?" }
 *   "don't,"    → { lead: "",   core: "don't",   trail: "," }
 */
function splitPunct(raw: string): { lead: string; core: string; trail: string } {
  const first = raw.search(/[a-zA-Z0-9]/);
  if (first < 0) return { lead: raw, core: "", trail: "" };
  let last = -1;
  for (let i = raw.length - 1; i >= 0; i--) {
    if (/[a-zA-Z0-9]/.test(raw[i])) { last = i; break; }
  }
  return { lead: raw.slice(0, first), core: raw.slice(first, last + 1), trail: raw.slice(last + 1) };
}

/**
 * Sub-split a whitespace token on em/en dashes (U+2013, U+2014) only when
 * alphabetic characters appear on both sides of the dash.
 * The dash is appended to the *preceding* word's trail so that plain
 * (unhighlighted) compounds render without extra spaces:
 *   "hour—when"  → [{ core:"hour", trail:"—" }, { core:"when", trail:"" }]
 */
type SubWord = { lead: string; core: string; trail: string };

function splitOnDashes(rawToken: string): SubWord[] {
  if (!/[a-zA-Z0-9][–—][a-zA-Z0-9]/.test(rawToken)) {
    return [splitPunct(rawToken)];
  }

  const parts = rawToken.split(/([–—]+)/);
  // parts alternates: word, dash, word, dash, word …
  const wordParts: string[] = [];
  const dashes: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) wordParts.push(parts[i]);
    else dashes.push(parts[i]);
  }

  return wordParts
    .map((part, i) => {
      const { lead, core, trail } = splitPunct(part);
      return { lead, core, trail: trail + (dashes[i] ?? "") };
    })
    .filter((sw) => sw.core); // drop empty word-parts (e.g. leading dash in "—word")
}

/**
 * Splits verse text into MarkedSegment[] with unique-word/phrase flags.
 *
 * Key design decisions:
 * - Leading/trailing punctuation around a highlighted word is emitted as
 *   separate unstyled segments so only the alphabetic core is highlighted.
 * - Em/en dashes inside a whitespace token are treated as word separators;
 *   each word on either side is looked up independently.
 * - The trailing space is excluded from styled spans; `noSpaceAfter` marks
 *   sub-segments within a single whitespace token that must not add a space.
 */
export function markupVerse(
  text: string,
  uniqueWords: Set<string>,
  uniquePhrases: Set<string>,
  opts: TokenizationOptions,
  includeUniqueWords: boolean,
  includeUniquePhrases: boolean
): MarkedSegment[] {
  const rawTokens = text.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return [{ text, isUniqueWord: false, isUniquePhrase: false }];

  // ── 1. Build word-atom list ──────────────────────────────────────────────
  // Each whitespace token may expand into multiple sub-words (via em-dash splits).
  // isLastInGroup = final sub-word for its whitespace token → gets a trailing space.
  type Atom = SubWord & { norm: string; isLastInGroup: boolean };
  const atoms: Atom[] = [];

  for (const rawToken of rawTokens) {
    const subs = splitOnDashes(rawToken);
    subs.forEach((sw, si) => {
      atoms.push({ ...sw, norm: sw.core ? normalizeForLookup(sw.core, opts) : "", isLastInGroup: si === subs.length - 1 });
    });
  }

  const n = atoms.length;
  const norms = atoms.map((a) => a.norm);

  // ── 2. Phrase detection over atom indices ────────────────────────────────
  const phraseSpans = new Array<number>(n).fill(0);

  if (includeUniquePhrases) {
    if (opts.analyzeThreeWordPhrases) {
      for (let i = 0; i + 2 < n; i++) {
        if (!norms[i] || !norms[i + 1] || !norms[i + 2]) continue;
        const p = `${norms[i]} ${norms[i + 1]} ${norms[i + 2]}`;
        if (uniquePhrases.has(p) && phraseSpans[i] < 3) phraseSpans[i] = 3;
      }
    }
    if (opts.analyzeTwoWordPhrases) {
      for (let i = 0; i + 1 < n; i++) {
        if (!norms[i] || !norms[i + 1]) continue;
        const p = `${norms[i]} ${norms[i + 1]}`;
        if (uniquePhrases.has(p) && phraseSpans[i] === 0) phraseSpans[i] = 2;
      }
    }
  }

  // ── 3. Emit segments ─────────────────────────────────────────────────────
  const segments: MarkedSegment[] = [];
  function add(seg: MarkedSegment) { if (seg.text) segments.push(seg); }

  let i = 0;
  while (i < n) {
    const spanLen = phraseSpans[i];

    if (spanLen > 0 && includeUniquePhrases) {
      // ── Phrase span ──────────────────────────────────────────────────────
      const first = atoms[i];
      const last = atoms[i + spanLen - 1];

      const hasUniqueWord =
        includeUniqueWords && norms.slice(i, i + spanLen).some((nw) => nw && uniqueWords.has(nw));

      // Build the highlighted text: join cores with their inter-word content.
      // Each atom's trail (which may contain a dash) is appended before the
      // next atom; cross-group boundaries get a space.
      let phraseText = first.core;
      for (let j = i + 1; j < i + spanLen; j++) {
        const prev = atoms[j - 1];
        phraseText += prev.trail;
        if (prev.isLastInGroup) phraseText += " ";
        phraseText += atoms[j].lead + atoms[j].core;
      }

      if (first.lead) add({ text: first.lead, isUniqueWord: false, isUniquePhrase: false, noSpaceAfter: true });
      add({ text: phraseText, isUniqueWord: hasUniqueWord, isUniquePhrase: true, phraseLen: spanLen as 2 | 3, noSpaceAfter: !!last.trail || !last.isLastInGroup });
      if (last.trail) add({ text: last.trail, isUniqueWord: false, isUniquePhrase: false, noSpaceAfter: !last.isLastInGroup });

      i += spanLen;
    } else {
      // ── Single word ──────────────────────────────────────────────────────
      const atom = atoms[i];
      const isUnique = includeUniqueWords && !!atom.norm && uniqueWords.has(atom.norm);
      const noSpaceAfter = !atom.isLastInGroup;

      if (isUnique && atom.core) {
        if (atom.lead) add({ text: atom.lead, isUniqueWord: false, isUniquePhrase: false, noSpaceAfter: true });
        add({ text: atom.core, isUniqueWord: true, isUniquePhrase: false, noSpaceAfter: !!atom.trail || noSpaceAfter });
        if (atom.trail) add({ text: atom.trail, isUniqueWord: false, isUniquePhrase: false, noSpaceAfter });
      } else {
        // Plain: emit the whole raw token content as one unstyled segment
        const full = atom.lead + atom.core + atom.trail;
        add({ text: full, isUniqueWord: false, isUniquePhrase: false, noSpaceAfter });
      }

      i++;
    }
  }

  return segments;
}
