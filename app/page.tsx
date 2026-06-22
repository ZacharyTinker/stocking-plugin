"use client";

import { useState, useMemo } from "react";
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

const DEFAULT_TOKEN_OPTS: TokenizationOptions = {
  hyphenatedWordsAsSingle: false,
  contractionsAsSingle: true,
  includePossessives: false,
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
  wordStyle: { bold: true, italic: false, underline: false, highlight: "", color: "", sizeBoost: 0 },
  phrase2Style: { bold: false, italic: false, underline: true, highlight: "", color: "", sizeBoost: 0 },
  phrase3Style: { bold: false, italic: false, underline: false, highlight: "#add8e6", color: "", sizeBoost: 0 },
  bookTitleStyle:      { ...DEFAULT_ELEMENT, bold: true, fontSize: 26 },
  chapterHeadingStyle: { ...DEFAULT_ELEMENT, bold: true, fontSize: 20 },
  sectionHeadingStyle: { ...DEFAULT_ELEMENT, bold: true, italic: true, fontSize: 14 },
  verseNumberStyle:    { ...DEFAULT_ELEMENT, color: "#888888", fontSize: 10, superscript: true },
  chapterPageBreak: false,
};

type Tab = "input" | "preview";
type InputMode = "api" | "manual";

export default function Home() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tokenOpts, setTokenOpts] = useState<TokenizationOptions>(DEFAULT_TOKEN_OPTS);
  const [displayOpts, setDisplayOpts] = useState<DisplayOptions>(DEFAULT_DISPLAY_OPTS);
  const [keyVerses, setKeyVerses] = useState<Map<string, string>>(new Map());
  const [clubStyles, setClubStyles] = useState<Record<string, ClubStyle>>({});
  const [tab, setTab] = useState<Tab>("input");
  const [inputMode, setInputMode] = useState<InputMode>("api");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const result: AnalysisResult = useMemo(
    () =>
      verses.length > 0
        ? analyzeVerses(verses, tokenOpts)
        : { verses: [], uniqueWords: new Set(), uniquePhrases: new Set(), wordFrequency: new Map() },
    [verses, tokenOpts]
  );

  function handleParsed(v: Verse[]) {
    setVerses(v);
    setTab("preview");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Bible Quizzing Markup Tool</h1>
            <p className="text-xs text-gray-500">Identify unique words and phrases for study materials</p>
          </div>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {settingsOpen && (
          <div className="bg-white border rounded-lg p-5 shadow-sm no-print">
            <h2 className="font-semibold text-gray-800 mb-4">Settings</h2>
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

        <div className="flex border-b no-print">
          {(["input", "preview"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {t === "input" ? "Input" : "Preview & Export"}
              {t === "preview" && verses.length > 0 && (
                <span className="ml-1.5 text-xs bg-green-100 text-green-700 rounded px-1">
                  {verses.length} verses
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "input" && (
          <div className="bg-white border rounded-lg p-5 shadow-sm space-y-5">
            {/* Input mode toggle */}
            <div className="flex gap-1 border rounded-lg p-1 w-fit bg-gray-100">
              {([["api", "Fetch from API"], ["manual", "Paste / Upload"]] as [InputMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    inputMode === mode ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {inputMode === "api" ? (
              <>
                <h2 className="font-semibold text-gray-800">Select a passage</h2>
                <PassageSelector onFetched={handleParsed} />
              </>
            ) : (
              <>
                <h2 className="font-semibold text-gray-800">Paste or upload Scripture text</h2>
                <ScriptureInput onParsed={handleParsed} />
              </>
            )}

            {/* Key Verse upload — available regardless of input mode */}
            <div className="border-t pt-4">
              <h2 className="font-semibold text-gray-800 mb-2">Key Verses</h2>
              <p className="text-xs text-gray-500 mb-3">
                Upload a list of key verses (Club 75 / 150 / 300 or custom clubs) to show circle indicators next to verse numbers.
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

        {tab === "preview" && (
          <div className="space-y-4">
            {verses.length === 0 ? (
              <div className="bg-white border rounded-lg p-8 text-center text-gray-500 text-sm">
                Go to the <strong>Input</strong> tab and parse Scripture first.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 no-print">
                  <div className="text-sm text-gray-600">
                    <strong>{verses.length}</strong> verses &bull;{" "}
                    <strong>{result.uniqueWords.size}</strong> unique words
                    {keyVerses.size > 0 && <> &bull; <strong>{keyVerses.size}</strong> key verses</>}
                  </div>
                  <ExportButtons result={result} tokenOpts={tokenOpts} displayOpts={displayOpts} keyVerses={keyVerses} clubStyles={clubStyles} />
                </div>
                <div className="no-print"><WordList result={result} /></div>
                <div className="no-print"><WordFrequency result={result} /></div>
                <Preview result={result} tokenOpts={tokenOpts} displayOpts={displayOpts} keyVerses={keyVerses} clubStyles={clubStyles} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
