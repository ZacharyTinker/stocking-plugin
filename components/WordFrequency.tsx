"use client";

import { useState, useMemo } from "react";
import { AnalysisResult } from "@/types/scripture";

interface Props {
  result: AnalysisResult;
}

type SortKey = "word" | "count";

export default function WordFrequency({ result }: Props) {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const entries = [...result.wordFrequency.entries()];
    return entries
      .filter(([word]) => !search || word.includes(search.toLowerCase()))
      .sort(([aWord, aCount], [bWord, bCount]) => {
        const cmp = sortKey === "count" ? aCount - bCount : aWord.localeCompare(bWord);
        return sortAsc ? cmp : -cmp;
      });
  }, [result.wordFrequency, sortKey, sortAsc, search]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "word"); }
  }

  function exportCSV() {
    const lines = ["Word,Count,Unique"];
    for (const [word, count] of rows) {
      lines.push(`"${word}",${count},${result.uniqueWords.has(word) ? "yes" : "no"}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "word-frequency.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (result.wordFrequency.size === 0) return null;

  return (
    <div>
      <button className="collapse-toggle" onClick={() => setOpen(v => !v)}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "20px", height: "20px", borderRadius: "6px",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white",
          fontSize: "11px", fontWeight: "bold", flexShrink: 0,
          transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s",
        }}>▶</span>
        <span>Word Frequency</span>
        <span className="bq-badge">{result.wordFrequency.size} words</span>
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex gap-2 items-center pb-2 flex-wrap">
            <input
              type="search"
              placeholder="Filter words…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bq-input flex-1 min-w-32"
            />
            <button onClick={exportCSV} className="btn-secondary whitespace-nowrap">
              Export CSV
            </button>
          </div>

          <div className="overflow-auto max-h-64 rounded-xl text-sm"
               style={{ border: "1.5px solid #ddd6fe" }}>
            <table className="w-full border-collapse">
              <thead className="sticky top-0" style={{ background: "#ede9fe" }}>
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-bold text-violet-700 cursor-pointer select-none uppercase tracking-wide"
                      onClick={() => toggleSort("word")}>
                    Word {sortKey === "word" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-violet-700 cursor-pointer select-none uppercase tracking-wide w-20"
                      onClick={() => toggleSort("count")}>
                    Count {sortKey === "count" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-bold text-violet-700 uppercase tracking-wide w-20">Tag</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([word, count]) => (
                  <tr key={word} className="border-t hover:bg-violet-50 transition-colors" style={{ borderColor: "#ede9fe" }}>
                    <td className="px-3 py-1.5 font-mono text-violet-900">{word}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-violet-700 font-semibold">{count}</td>
                    <td className="px-3 py-1.5 text-center">
                      {result.uniqueWords.has(word) && (
                        <span className="bq-badge">unique</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-violet-300">No matches</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-violet-400 mt-1">{rows.length} of {result.wordFrequency.size} words shown</p>
        </div>
      )}
    </div>
  );
}
