"use client";

import { useState, useMemo, useEffect } from "react";
import ScriptureInput from "@/components/ScriptureInput";
import PassageSelector from "@/components/PassageSelector";
import Preview from "@/components/Preview";
import SettingsPanel from "@/components/SettingsPanel";
import ExportButtons from "@/components/ExportButtons";
import WordList from "@/components/WordList";
import WordFrequency from "@/components/WordFrequency";
import KeyVerseUpload from "@/components/KeyVerseUpload";
import { Verse, TokenizationOptions, DisplayOptions, AnalysisResult, ElementStyle, ClubStyle } from "@/types/scripture";
import { analyzeVerses } from "@/lib/analyze";

const LS_KEY = "bq-settings";

const DEFAULT_TOKEN_OPTS: TokenizationOptions = {
  hyphenatedWordsAsSingle: true,
  contractionsAsSingle: true,
  includePossessives: true,
  analyzeTwoWordPhrases: false,
  analyzeThreeWordPhrases: false,
  includeUniqueWords: true,
  includeUniquePhrases: false,
};

const DEFAULT_ELEMENT: ElementStyle = { bold: false, italic: false, underline: false, highlight: "", color: "", fontSize: 16 };

const DEFAULT_DISPLAY_OPTS: DisplayOptions = {
  fontFamily: "Georgia, serif",
  fontSize: 16,
  lineSpacing: 1.8,
  includeSectionHeadings: true,
  includeFootnotes: false,
  wordStyle:    { bold: true,  italic: false, underline: false, highlight: "",        color: "#1d4ed8", sizeBoost: 0 },
  phrase2Style: { bold: false, italic: true,  underline: true,  highlight: "",        color: "",        sizeBoost: 0 },
  phrase3Style: { bold: false, italic: false, underline: false, highlight: "#fef08a", color: "",        sizeBoost: 0 },
  bookTitleStyle:      { ...DEFAULT_ELEMENT, bold: true, fontSize: 26 },
  chapterHeadingStyle: { ...DEFAULT_ELEMENT, bold: true, fontSize: 20 },
  sectionHeadingStyle: { ...DEFAULT_ELEMENT, bold: true, italic: true, fontSize: 14 },
  verseNumberStyle:    { ...DEFAULT_ELEMENT, color: "#888888", fontSize: 10, superscript: true },
  chapterPageBreak: false,
  verseLayout: "lines",
};

type Tab = "input" | "preview";
type InputMode = "api" | "manual";

export default function Home() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tokenOpts, setTokenOpts] = useState<TokenizationOptions>(DEFAULT_TOKEN_OPTS);
  const [displayOpts, setDisplayOpts] = useState<DisplayOptions>(DEFAULT_DISPLAY_OPTS);
  const [keyVerses, setKeyVerses] = useState<Map<string, string>>(new Map());
  const [clubStyles, setClubStyles] = useState<Record<string, ClubStyle>>({});
  const [excludedWords, setExcludedWords] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("input");
  const [inputMode, setInputMode] = useState<InputMode>("api");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportSuffix, setExportSuffix] = useState("");

  // Restore persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.tokenOpts) setTokenOpts({ ...DEFAULT_TOKEN_OPTS, ...data.tokenOpts });
      if (data.displayOpts) {
        const d = data.displayOpts;
        setDisplayOpts({
          ...DEFAULT_DISPLAY_OPTS,
          ...d,
          wordStyle:            { ...DEFAULT_DISPLAY_OPTS.wordStyle,            ...(d.wordStyle            ?? {}) },
          phrase2Style:         { ...DEFAULT_DISPLAY_OPTS.phrase2Style,         ...(d.phrase2Style         ?? {}) },
          phrase3Style:         { ...DEFAULT_DISPLAY_OPTS.phrase3Style,         ...(d.phrase3Style         ?? {}) },
          bookTitleStyle:       { ...DEFAULT_DISPLAY_OPTS.bookTitleStyle,       ...(d.bookTitleStyle       ?? {}) },
          chapterHeadingStyle:  { ...DEFAULT_DISPLAY_OPTS.chapterHeadingStyle,  ...(d.chapterHeadingStyle  ?? {}) },
          sectionHeadingStyle:  { ...DEFAULT_DISPLAY_OPTS.sectionHeadingStyle,  ...(d.sectionHeadingStyle  ?? {}) },
          verseNumberStyle:     { ...DEFAULT_DISPLAY_OPTS.verseNumberStyle,     ...(d.verseNumberStyle     ?? {}) },
        });
      }
      if (data.clubStyles) setClubStyles(data.clubStyles);
      if (data.excludedWords) setExcludedWords(new Set(data.excludedWords as string[]));
      if (data.keyVerses) setKeyVerses(new Map(data.keyVerses as [string, string][]));
      if (data.exportSuffix) setExportSuffix(data.exportSuffix);
    } catch { /* ignore corrupted storage */ }
  }, []);

  // Persist settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        tokenOpts,
        displayOpts,
        clubStyles,
        excludedWords: [...excludedWords],
        keyVerses: [...keyVerses],
        exportSuffix,
      }));
    } catch { /* ignore quota errors */ }
  }, [tokenOpts, displayOpts, clubStyles, excludedWords, keyVerses, exportSuffix]);

  const result: AnalysisResult = useMemo(
    () =>
      verses.length > 0
        ? analyzeVerses(verses, tokenOpts)
        : { verses: [], uniqueWords: new Set(), uniquePhrases: new Set(), wordFrequency: new Map(), uniqueWordVerses: new Map(), wordVerseIndex: new Map(), phraseVerseMap: new Map() },
    [verses, tokenOpts]
  );

  const activeResult: AnalysisResult = useMemo(() => {
    if (excludedWords.size === 0) return result;
    const uniqueWords = new Set([...result.uniqueWords].filter(w => !excludedWords.has(w)));
    const uniqueWordVerses = new Map([...result.uniqueWordVerses].filter(([w]) => !excludedWords.has(w)));
    const uniquePhrases = new Set([...result.uniquePhrases].filter(p =>
      !p.split(" ").some(w => excludedWords.has(w))
    ));
    return { ...result, uniqueWords, uniqueWordVerses, uniquePhrases };
  }, [result, excludedWords]);

  const passageName = useMemo(() => {
    if (verses.length === 0) return "Scripture";
    const book = verses[0].book;
    const firstCh = verses[0].chapter;
    const lastCh = verses[verses.length - 1].chapter;
    return firstCh === lastCh ? `${book} ${firstCh}` : `${book} ${firstCh}-${lastCh}`;
  }, [verses]);

  function handleParsed(v: Verse[]) {
    setVerses(v);
    setExcludedWords(new Set());
    setTab("preview");
  }

  function handleExclude(word: string) {
    setExcludedWords(prev => new Set([...prev, word]));
  }

  function handleRestore(word: string) {
    setExcludedWords(prev => { const s = new Set(prev); s.delete(word); return s; });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="no-print" style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #1e1b4b 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)"
      }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <span className="text-lg">📖</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-white text-lg leading-tight tracking-tight">
                Bible<span className="gradient-text">Quiz</span> Markup
              </h1>
              <p className="text-violet-300 text-xs hidden sm:block">unique words for study</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {verses.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="bq-badge">{verses.length} verses</span>
                <span className="bq-badge">{activeResult.uniqueWords.size} unique</span>
                {keyVerses.size > 0 && <span className="bq-badge bq-badge-green">{keyVerses.size} key</span>}
              </div>
            )}
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-white"
              style={{ background: settingsOpen ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)" }}
              title="Settings"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Settings panel */}
        {settingsOpen && (
          <div className="bq-card no-print">
            <p className="bq-section-title">Settings</p>
            <SettingsPanel
              tokenOpts={tokenOpts}
              displayOpts={displayOpts}
              onTokenChange={setTokenOpts}
              onDisplayChange={setDisplayOpts}
              clubStyles={clubStyles}
              keyVerses={keyVerses}
              onClubStylesChange={setClubStyles}
            />
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar no-print">
          <button
            className={`tab-btn ${tab === "input" ? "active" : ""}`}
            onClick={() => setTab("input")}
          >
            ✏️ Input
          </button>
          <button
            className={`tab-btn ${tab === "preview" ? "active" : ""}`}
            onClick={() => setTab("preview")}
          >
            👁 Preview &amp; Export
            {verses.length > 0 && (
              <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                    style={{ background: tab === "preview" ? "rgba(255,255,255,0.25)" : "#ede9fe", color: tab === "preview" ? "white" : "#5b21b6" }}>
                {verses.length}
              </span>
            )}
          </button>
        </div>

        {/* Input tab */}
        {tab === "input" && (
          <div className="space-y-4">
            <div className="bq-card no-print space-y-4">
              {/* Mode toggle */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="bq-section-title mb-0" style={{ marginBottom: 0 }}>Load Scripture</p>
                <div className="segment-control">
                  <button className={`segment-btn ${inputMode === "api" ? "active" : ""}`} onClick={() => setInputMode("api")}>
                    🌐 Fetch
                  </button>
                  <button className={`segment-btn ${inputMode === "manual" ? "active" : ""}`} onClick={() => setInputMode("manual")}>
                    📋 Paste
                  </button>
                </div>
              </div>

              {inputMode === "api" ? (
                <PassageSelector onFetched={handleParsed} />
              ) : (
                <ScriptureInput onParsed={handleParsed} />
              )}
            </div>

            {/* Key Verses */}
            <div className="bq-card no-print">
              <p className="bq-section-title">Key Verses</p>
              <p className="text-sm text-violet-400 mb-3">
                Upload a CSV of key verses to show circle indicators next to verse numbers in the markup.
              </p>
              <KeyVerseUpload
                keyVerses={keyVerses}
                clubStyles={clubStyles}
                onLoad={({ keyVerses: kv, clubStyles: cs }) => { setKeyVerses(kv); setClubStyles(cs); }}
                onClear={() => { setKeyVerses(new Map()); setClubStyles({}); }}
              />
            </div>
          </div>
        )}

        {/* Preview tab */}
        {tab === "preview" && (
          <div className="space-y-4">
            {verses.length === 0 ? (
              <div className="bq-card text-center py-12">
                <div className="text-4xl mb-3">📖</div>
                <p className="font-bold text-violet-800 text-lg mb-1">No scripture loaded</p>
                <p className="text-violet-400 text-sm">Go to the Input tab to fetch or paste a passage.</p>
                <button className="btn-primary mt-4" onClick={() => setTab("input")}>
                  Go to Input →
                </button>
              </div>
            ) : (
              <>
                {/* Mobile stats bar */}
                <div className="sm:hidden flex gap-2 flex-wrap no-print">
                  <span className="bq-badge">{verses.length} verses</span>
                  <span className="bq-badge">{activeResult.uniqueWords.size} unique words</span>
                  {excludedWords.size > 0 && <span className="bq-badge bq-badge-orange">{excludedWords.size} excluded</span>}
                  {keyVerses.size > 0 && <span className="bq-badge bq-badge-green">{keyVerses.size} key verses</span>}
                </div>

                {/* Export card */}
                <div className="bq-card no-print">
                  <p className="bq-section-title">Export</p>
                  <ExportButtons
                    result={activeResult}
                    tokenOpts={tokenOpts}
                    displayOpts={displayOpts}
                    keyVerses={keyVerses}
                    clubStyles={clubStyles}
                    passageName={passageName}
                    exportSuffix={exportSuffix}
                    onExportSuffixChange={setExportSuffix}
                  />
                </div>

                {/* Word analysis */}
                <div className="bq-card no-print">
                  <WordList
                    result={result}
                    excludedWords={excludedWords}
                    onExclude={handleExclude}
                    onRestore={handleRestore}
                  />
                </div>

                <div className="bq-card no-print">
                  <WordFrequency result={activeResult} />
                </div>

                {/* Scripture preview */}
                <div className="bq-card preview-area" style={{ padding: "1.5rem" }}>
                  <Preview result={activeResult} tokenOpts={tokenOpts} displayOpts={displayOpts} keyVerses={keyVerses} clubStyles={clubStyles} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
