"use client";

import { AnalysisResult } from "@/types/scripture";
import { useState } from "react";

interface Props {
  result: AnalysisResult;
  excludedWords: Set<string>;
  onExclude: (word: string) => void;
  onRestore: (word: string) => void;
}

export default function WordList({ result, excludedWords, onExclude, onRestore }: Props) {
  const [show, setShow] = useState(false);

  const activeWords = [...result.uniqueWords].filter(w => !excludedWords.has(w)).sort();
  const excludedList = [...excludedWords].sort();
  const phrases = [...result.uniquePhrases].sort();

  return (
    <div className="text-sm">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-blue-600 underline text-sm"
      >
        {show ? "Hide" : "Show"} unique word/phrase lists ({activeWords.length} words
        {excludedList.length > 0 && <>, <span className="text-orange-500">{excludedList.length} excluded</span></>}
        , {phrases.length} phrases)
      </button>
      {show && (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Unique words ({activeWords.length})</h4>
              <div className="h-48 overflow-y-auto border rounded p-2 text-xs font-mono bg-gray-50">
                {activeWords.map((w) => (
                  <div key={w} className="flex items-center justify-between group pr-1">
                    <span>{w}</span>
                    <button
                      onClick={() => onExclude(w)}
                      title="Exclude this word"
                      className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Unique phrases ({phrases.length})</h4>
              <div className="h-48 overflow-y-auto border rounded p-2 text-xs font-mono bg-gray-50">
                {phrases.map((p) => <div key={p}>{p}</div>)}
              </div>
            </div>
          </div>

          {excludedList.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1 text-orange-600">Excluded words ({excludedList.length})</h4>
              <div className="max-h-32 overflow-y-auto border border-orange-200 rounded p-2 text-xs font-mono bg-orange-50">
                {excludedList.map((w) => (
                  <div key={w} className="flex items-center justify-between group pr-1">
                    <span className="line-through text-gray-400">{w}</span>
                    <button
                      onClick={() => onRestore(w)}
                      title="Restore this word"
                      className="ml-2 text-orange-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ↩ restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
