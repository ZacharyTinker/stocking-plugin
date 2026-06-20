"use client";

import { AnalysisResult } from "@/types/scripture";
import { useState } from "react";

export default function WordList({ result }: { result: AnalysisResult }) {
  const [show, setShow] = useState(false);
  const words = [...result.uniqueWords].sort();
  const phrases = [...result.uniquePhrases].sort();

  return (
    <div className="text-sm">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-blue-600 underline text-sm"
      >
        {show ? "Hide" : "Show"} unique word/phrase lists ({words.length} words, {phrases.length} phrases)
      </button>
      {show && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-1">Unique words ({words.length})</h4>
            <div className="h-48 overflow-y-auto border rounded p-2 text-xs font-mono bg-gray-50">
              {words.map((w) => <div key={w}>{w}</div>)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Unique phrases ({phrases.length})</h4>
            <div className="h-48 overflow-y-auto border rounded p-2 text-xs font-mono bg-gray-50">
              {phrases.map((p) => <div key={p}>{p}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
