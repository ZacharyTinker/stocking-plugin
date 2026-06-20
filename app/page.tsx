"use client";

import { useState, useMemo } from "react";
import ScriptureInput from "@/components/ScriptureInput";
import PassageSelector from "@/components/PassageSelector";
import Preview from "@/components/Preview";
import SettingsPanel from "@/components/SettingsPanel";
import ExportButtons from "@/components/ExportButtons";
import WordList from "@/components/WordList";
import { Verse, TokenizationOptions, DisplayOptions, AnalysisResult } from "@/types/scripture";
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

const DEFAULT_DISPLAY_OPTS: DisplayOptions = {
  fontFamily: "Georgia, serif",
  fontSize: 16,
  lineSpacing: 1.8,
  includeSectionHeadings: true,
  includeFootnotes: false,
};

type Tab = "input" | "preview";
type InputMode = "api" | "manual";

export default function Home() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [tokenOpts, setTokenOpts] = useState<TokenizationOptions>(DEFAULT_TOKEN_OPTS);
  const [displayOpts, setDisplayOpts] = useState<DisplayOptions>(DEFAULT_DISPLAY_OPTS);
  const [tab, setTab] = useState<Tab>("input");
  const [inputMode, setInputMode] = useState<InputMode>("api");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const result: AnalysisResult = useMemo(
    () =>
      verses.length > 0
        ? analyzeVerses(verses, tokenOpts)
        : { verses: [], uniqueWords: new Set(), uniquePhrases: new Set() },
    [verses, tokenOpts]
  );

  function handleParsed(v: Verse[]) {
    setVerses(v);
    setTab("preview");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
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
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Settings</h2>
            <SettingsPanel
              tokenOpts={tokenOpts}
              displayOpts={displayOpts}
              onTokenChange={setTokenOpts}
              onDisplayChange={setDisplayOpts}
            />
          </div>
        )}

        <div className="flex border-b">
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
              {([["api", "Fetch from ESV API"], ["manual", "Paste / Upload"]] as [InputMode, string][]).map(([mode, label]) => (
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
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm text-gray-600">
                    <strong>{verses.length}</strong> verses &bull;{" "}
                    <strong>{result.uniqueWords.size}</strong> unique words across all {verses.length} verses
                  </div>
                  <ExportButtons result={result} tokenOpts={tokenOpts} displayOpts={displayOpts} />
                </div>
                <WordList result={result} />
                <Preview result={result} tokenOpts={tokenOpts} displayOpts={displayOpts} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
