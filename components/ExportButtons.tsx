"use client";

import { useState } from "react";
import { AnalysisResult, TokenizationOptions, DisplayOptions, ClubStyle } from "@/types/scripture";
import { markupVerse } from "@/lib/markup";
import { indicatorChar } from "@/components/ClubStylePicker";

interface Props {
  result: AnalysisResult;
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
  keyVerses?: Map<string, string>;
  clubStyles?: Record<string, ClubStyle>;
  passageName?: string;
  exportSuffix?: string;
  onExportSuffixChange?: (s: string) => void;
}

type AddonKey = "keywords" | "alphabetical" | "keyPhrases2" | "keyPhrases3" | "keyVerseGrid" | "concordance";

const ADDON_LABELS: Record<AddonKey, string> = {
  keywords: "Keywords",
  alphabetical: "Alphabetical Verses",
  keyPhrases2: "Key Phrases (2-word)",
  keyPhrases3: "Key Phrases (3-word)",
  keyVerseGrid: "Key Verse Grid",
  concordance: "Concordance",
};

export default function ExportButtons({
  result, tokenOpts, displayOpts, keyVerses, clubStyles,
  passageName = "Scripture", exportSuffix = "", onExportSuffixChange,
}: Props) {
  const { verses, uniqueWords, uniquePhrases, uniqueWordVerses, wordVerseIndex, phraseVerseMap, wordFrequency } = result;

  const [selectedAddons, setSelectedAddons] = useState<Set<AddonKey>>(new Set());

  function toggleAddon(k: AddonKey) {
    setSelectedAddons(prev => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k); else s.add(k);
      return s;
    });
  }

  function fileName(label?: string): string {
    const base = exportSuffix.trim() ? `${passageName} ${exportSuffix.trim()}` : passageName;
    return label ? `${base} ${label}` : base;
  }

  // ── Main exports ──────────────────────────────────────────────────────────

  async function handleDocx() {
    const { exportToDocx } = await import("@/lib/exportDocx");
    const blob = await exportToDocx(
      verses, uniqueWords, uniquePhrases, tokenOpts,
      tokenOpts.includeUniqueWords, tokenOpts.includeUniquePhrases,
      displayOpts, keyVerses, clubStyles
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleHTML() {
    const { wordStyle, phrase2Style, phrase3Style, fontSize,
            bookTitleStyle, chapterHeadingStyle, sectionHeadingStyle, verseNumberStyle,
            chapterPageBreak } = displayOpts;
    const superscript = verseNumberStyle.superscript !== false;

    function markupAttr(s: typeof wordStyle): string {
      const parts: string[] = [];
      if (s.bold) parts.push("font-weight:bold");
      if (s.italic) parts.push("font-style:italic");
      if (s.underline) parts.push("text-decoration:underline");
      if (s.highlight) parts.push(`background-color:${s.highlight}`);
      if (s.color) parts.push(`color:${s.color}`);
      if (s.sizeBoost) parts.push(`font-size:${fontSize + s.sizeBoost}px`);
      return parts.join(";");
    }

    function elementAttr(s: typeof bookTitleStyle): string {
      const parts: string[] = [];
      parts.push(`font-size:${s.fontSize}px`);
      parts.push(`font-weight:${s.bold ? "bold" : "normal"}`);
      parts.push(`font-style:${s.italic ? "italic" : "normal"}`);
      if (s.underline) parts.push("text-decoration:underline");
      if (s.highlight) parts.push(`background-color:${s.highlight}`);
      if (s.color) parts.push(`color:${s.color}`);
      return parts.join(";");
    }

    function segStyle(seg: { isUniqueWord: boolean; isUniquePhrase: boolean; phraseLen?: 2 | 3 }): string {
      const parts: string[] = [];
      if (seg.isUniquePhrase) parts.push(markupAttr(seg.phraseLen === 3 ? phrase3Style : phrase2Style));
      if (seg.isUniqueWord) parts.push(markupAttr(wordStyle));
      return parts.filter(Boolean).join(";");
    }

    const paragraphMode = displayOpts.verseLayout === "paragraph";

    function verseNumberHTML(verse: typeof verses[number]): string {
      const verseId = `${verse.book} ${verse.chapter}:${verse.verse}`;
      const club = keyVerses?.get(verseId);
      const cs = club ? clubStyles?.[club] : undefined;
      const vnTag = superscript ? "sup" : "span";
      if (cs && cs.indicator !== "none") {
        if (cs.indicator === "dot") {
          const vnSize = verseNumberStyle.fontSize;
          const vnColor = verseNumberStyle.color || "#888888";
          const va = superscript ? "vertical-align:super;" : "";
          return `<span style="color:${cs.color};font-size:${vnSize}px;${va}margin-right:0.1em">•</span><span style="color:${vnColor};font-size:${vnSize}px;${va}">${verse.verse}</span> `;
        }
        const bg = cs.indicator === "filled" ? `background:${cs.color};color:white` : `border:1.5px solid ${cs.color};color:#555`;
        return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:1.6em;height:1.6em;border-radius:50%;${bg};font-size:${verseNumberStyle.fontSize}px;${superscript ? "vertical-align:super;" : ""}line-height:1;margin-right:0.2em">${verse.verse}</span> `;
      }
      return `<${vnTag} class="verse-number">${verse.verse}</${vnTag}>`;
    }

    function verseInnerHTML(verse: typeof verses[number]): string {
      const segments = markupVerse(verse.text, uniqueWords, uniquePhrases, tokenOpts, tokenOpts.includeUniqueWords, tokenOpts.includeUniquePhrases);
      let out = verseNumberHTML(verse);
      for (const seg of segments) {
        const inlineStyle = segStyle(seg);
        const space = seg.noSpaceAfter ? "" : " ";
        if (inlineStyle) {
          out += `<span style="${inlineStyle}">${esc(seg.text)}</span>${space}`;
        } else {
          out += esc(seg.text) + space;
        }
      }
      return out;
    }

    async function buildFontEmbed(): Promise<string> {
      if (!displayOpts.fontFamily.includes("OpenDyslexic")) return "";
      const variants = [
        { weight: "normal", style: "normal",  file: "/fonts/OpenDyslexic-Regular.otf" },
        { weight: "bold",   style: "normal",  file: "/fonts/OpenDyslexic-Bold.otf" },
        { weight: "normal", style: "italic",  file: "/fonts/OpenDyslexic-Italic.otf" },
        { weight: "bold",   style: "italic",  file: "/fonts/OpenDyslexic-BoldItalic.otf" },
      ];
      let css = "";
      for (const v of variants) {
        try {
          const buf = await fetch(v.file).then((r) => r.arrayBuffer());
          const bytes = new Uint8Array(buf);
          const CHUNK = 8192;
          const chunks: string[] = [];
          for (let j = 0; j < bytes.length; j += CHUNK) {
            chunks.push(String.fromCharCode(...bytes.subarray(j, j + CHUNK)));
          }
          const b64 = btoa(chunks.join(""));
          css += `@font-face{font-family:"OpenDyslexic";src:url("data:font/opentype;base64,${b64}") format("opentype");font-weight:${v.weight};font-style:${v.style};font-display:swap;}\n`;
        } catch { /* skip if unavailable */ }
      }
      return css;
    }

    const fontEmbed = await buildFontEmbed();

    let legendHtml = "";
    if (clubStyles && Object.keys(clubStyles).length > 0 && keyVerses && keyVerses.size > 0) {
      const ordered = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);
      const items = ordered.map(([club, cs]) => {
        let ind = "";
        if (cs.indicator === "dot") {
          ind = `<span style="color:${cs.color};font-size:${verseNumberStyle.fontSize}px;margin-right:0.2em">•</span>`;
        } else if (cs.indicator !== "none") {
          const bg = cs.indicator === "filled" ? `background:${cs.color};color:white` : `border:1.5px solid ${cs.color};color:#555`;
          ind = `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:1.6em;height:1.6em;border-radius:50%;${bg};font-size:${verseNumberStyle.fontSize}px;line-height:1;margin-right:0.2em"></span>`;
        }
        return `<span style="display:inline-flex;align-items:center;gap:0.25em;margin-right:1em">${ind}${esc(club)}</span>`;
      }).join("");
      legendHtml = `<div class="club-legend"><span style="color:#888;margin-right:0.5em">Key:</span>${items}</div>\n`;
    }

    const book = verses[0]?.book ?? "Scripture";
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${book} - Bible Quizzing Markup</title>
<style>
${fontEmbed}  body { font-family: ${displayOpts.fontFamily}; font-size: ${fontSize}px; line-height: ${displayOpts.lineSpacing}; max-width: 800px; margin: 0 auto; padding: 2rem; }
  h1.book-title { margin-top: 2rem; ${elementAttr(bookTitleStyle)} }
  h2.chapter-heading { margin-top: 1.5rem; ${elementAttr(chapterHeadingStyle)}${chapterPageBreak ? " page-break-before:always;" : ""} }
  h3.section-heading { margin-top: 1rem; ${elementAttr(sectionHeadingStyle)} }
  .verse-number { ${elementAttr(verseNumberStyle)} margin-right: 0.25em;${superscript ? " vertical-align: super;" : ""} }
  .verse-line { margin: 0.2em 0; }
  .verse-paragraph { margin: 0.4em 0; text-align: justify; }
  .club-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25em; border: 1px solid #ddd; background: #f9fafb; border-radius: 4px; padding: 0.5em; margin-bottom: 1em; font-size: ${Math.round(fontSize * 0.85)}px; }
</style>
</head>
<body>
${legendHtml}`;

    let currentBook = "";
    let currentChapter = -1;
    let lastHeading = "";
    let paraOpen = false;
    function closePara() { if (paraOpen) { html += `</p>\n`; paraOpen = false; } }

    for (const verse of verses) {
      if (verse.book !== currentBook) {
        closePara();
        currentBook = verse.book;
        html += `<h1 class="book-title">${esc(verse.book)}</h1>\n`;
      }
      if (verse.chapter !== currentChapter) {
        closePara();
        currentChapter = verse.chapter;
        html += `<h2 class="chapter-heading">Chapter ${verse.chapter}</h2>\n`;
      }
      if (displayOpts.includeSectionHeadings && verse.sectionHeading && verse.sectionHeading !== lastHeading) {
        closePara();
        lastHeading = verse.sectionHeading;
        html += `<h3 class="section-heading">${esc(verse.sectionHeading)}</h3>\n`;
      }

      if (paragraphMode) {
        if (!paraOpen) { html += `<p class="verse-paragraph">`; paraOpen = true; }
        html += verseInnerHTML(verse);
      } else {
        html += `<p class="verse-line">${verseInnerHTML(verse)}</p>\n`;
      }
    }
    closePara();
    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleStudyCards() {
    const { exportStudyCards } = await import("@/lib/exportStudyCards");
    exportStudyCards(verses, uniqueWords, uniquePhrases, tokenOpts, displayOpts);
  }

  function handlePrint() {
    window.print();
  }

  // ── Addon export ──────────────────────────────────────────────────────────

  async function handleExportAddons() {
    if (selectedAddons.size === 0) return;

    const { wrapAddonHtml } = await import("@/lib/exportKeywords");
    const sections: string[] = [];

    if (selectedAddons.has("keywords")) {
      const { keywordsSection } = await import("@/lib/exportKeywords");
      sections.push(keywordsSection(verses, uniqueWords, uniqueWordVerses, fileName()));
    }
    if (selectedAddons.has("alphabetical")) {
      const { alphabeticalSection } = await import("@/lib/exportAlphabetical");
      sections.push(alphabeticalSection(verses, uniqueWords, fileName()));
    }
    if (selectedAddons.has("keyPhrases2") || selectedAddons.has("keyPhrases3")) {
      const { keyPhrasesSection } = await import("@/lib/exportKeyPhrases");
      sections.push(keyPhrasesSection(
        verses, uniquePhrases, phraseVerseMap, fileName(),
        selectedAddons.has("keyPhrases2"),
        selectedAddons.has("keyPhrases3")
      ));
    }
    if (selectedAddons.has("keyVerseGrid") && keyVerses && clubStyles && keyVerses.size > 0) {
      const { keyVerseGridSection } = await import("@/lib/exportKeyVerseGrid");
      sections.push(keyVerseGridSection(verses, keyVerses, clubStyles, fileName()));
    }
    if (selectedAddons.has("concordance")) {
      const { concordanceSection } = await import("@/lib/exportConcordance");
      sections.push(concordanceSection(verses, wordFrequency, wordVerseIndex, fileName()));
    }

    if (sections.length === 0) return;
    const combined = sections.join("\n");
    const html = wrapAddonHtml(combined, fileName("Addons"));
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName("Addons")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (verses.length === 0) return null;

  const hasKeyVerses = (keyVerses?.size ?? 0) > 0;
  const hasPhrases = uniquePhrases.size > 0;

  const allAddons: AddonKey[] = ["keywords", "alphabetical", "keyPhrases2", "keyPhrases3", "keyVerseGrid", "concordance"];
  const disabledAddons: Set<AddonKey> = new Set([
    ...(!hasKeyVerses ? ["keyVerseGrid"] as AddonKey[] : []),
    ...(!hasPhrases ? ["keyPhrases2", "keyPhrases3"] as AddonKey[] : []),
  ]);

  return (
    <div className="flex flex-col gap-4 no-print">
      {/* File name row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-violet-500 uppercase tracking-wide whitespace-nowrap">File:</span>
        <span className="text-sm font-bold text-violet-800">{passageName}</span>
        <input
          type="text"
          placeholder="optional suffix…"
          value={exportSuffix}
          onChange={(e) => onExportSuffixChange?.(e.target.value)}
          className="bq-input"
          style={{ maxWidth: "160px" }}
        />
      </div>

      {/* Main exports */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleDocx}
          className="btn-primary"
          style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
          📄 DOCX
        </button>
        <button onClick={handleHTML}
          className="btn-primary"
          style={{ background: "linear-gradient(135deg,#4f46e5,#3730a3)" }}>
          🌐 HTML
        </button>
        <button onClick={handleStudyCards}
          className="btn-primary"
          style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
          🃏 Cards
        </button>
        <button onClick={handlePrint} className="btn-secondary">
          🖨 Print
        </button>
      </div>

      {/* Addon selector */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
        <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">Addon Exports</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(allAddons as AddonKey[]).map((k) => {
            const disabled = disabledAddons.has(k);
            const checked = selectedAddons.has(k);
            return (
              <label key={k} className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer ${disabled ? "opacity-35 cursor-not-allowed" : ""}`}
                     style={{ color: checked ? "#5b21b6" : "#7c3aed" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleAddon(k)}
                  className="rounded"
                  style={{ accentColor: "#7c3aed" }}
                />
                {ADDON_LABELS[k]}
              </label>
            );
          })}
        </div>
        <button
          onClick={handleExportAddons}
          disabled={selectedAddons.size === 0}
          className="btn-primary"
          style={{
            background: selectedAddons.size > 0 ? "linear-gradient(135deg,#d97706,#b45309)" : undefined,
            boxShadow: selectedAddons.size > 0 ? "0 4px 12px rgba(217,119,6,0.3)" : undefined,
          }}
        >
          ✨ Export {selectedAddons.size > 0 ? `${selectedAddons.size} selected` : "addons"}
        </button>
      </div>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
