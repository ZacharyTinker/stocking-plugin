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
    <div className="bg-white border rounded-lg shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>Word Frequency <span className="text-gray-400 font-normal">({result.wordFrequency.size} unique words)</span></span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t px-4 pb-4">
          <div className="flex gap-2 items-center pt-3 pb-2 flex-wrap">
            <input
              type="search"
              placeholder="Filter words…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={exportCSV}
              className="border rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-auto max-h-72 border rounded text-sm">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th
                    className="text-left px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none border-b"
                    onClick={() => toggleSort("word")}
                  >
                    Word {sortKey === "word" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="text-right px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none border-b w-20"
                    onClick={() => toggleSort("count")}
                  >
                    Count {sortKey === "count" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-gray-600 border-b w-20">Unique</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([word, count]) => (
                  <tr key={word} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono">{word}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{count}</td>
                    <td className="px-3 py-1.5 text-center">
                      {result.uniqueWords.has(word) && (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">unique</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">No matches</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-1">{rows.length} of {result.wordFrequency.size} words shown</p>
        </div>
      )}
    </div>
  );
}
