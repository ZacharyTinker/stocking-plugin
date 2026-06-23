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
    <div>
      <button className="collapse-toggle" onClick={() => setShow(v => !v)}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "20px", height: "20px", borderRadius: "6px",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white",
          fontSize: "11px", fontWeight: "bold", flexShrink: 0,
          transform: show ? "rotate(90deg)" : "none", transition: "transform 0.2s",
        }}>▶</span>
        <span>Word &amp; Phrase Lists</span>
        <span className="bq-badge">{activeWords.length} words</span>
        {excludedList.length > 0 && <span className="bq-badge bq-badge-orange">{excludedList.length} excluded</span>}
        {phrases.length > 0 && <span className="bq-badge">{phrases.length} phrases</span>}
      </button>

      {show && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="bq-section-title">Unique Words ({activeWords.length})</p>
              <div className="h-44 overflow-y-auto rounded-xl p-2 text-xs font-mono"
                   style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
                {activeWords.map((w) => (
                  <div key={w} className="flex items-center justify-between group py-0.5 px-1 rounded hover:bg-white">
                    <span className="text-violet-800">{w}</span>
                    <button
                      onClick={() => onExclude(w)}
                      title="Exclude"
                      className="ml-2 text-violet-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-base leading-none font-bold"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>

            {phrases.length > 0 && (
              <div>
                <p className="bq-section-title">Unique Phrases ({phrases.length})</p>
                <div className="h-44 overflow-y-auto rounded-xl p-2 text-xs font-mono"
                     style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
                  {phrases.map((p) => (
                    <div key={p} className="py-0.5 px-1 text-violet-800">{p}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {excludedList.length > 0 && (
            <div>
              <p className="bq-section-title" style={{ color: "#b45309" }}>Excluded Words ({excludedList.length})</p>
              <div className="max-h-32 overflow-y-auto rounded-xl p-2 text-xs font-mono"
                   style={{ background: "#fff7ed", border: "1.5px solid #fed7aa" }}>
                {excludedList.map((w) => (
                  <div key={w} className="flex items-center justify-between group py-0.5 px-1 rounded hover:bg-white">
                    <span className="line-through text-amber-400">{w}</span>
                    <button
                      onClick={() => onRestore(w)}
                      title="Restore"
                      className="ml-2 text-amber-300 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all text-xs font-semibold"
                    >↩ restore</button>
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
