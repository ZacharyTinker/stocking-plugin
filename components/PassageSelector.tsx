"use client";

import { useState } from "react";
import { Verse } from "@/types/scripture";
import { BOOKS, chapterCount } from "@/lib/bookList";
import { TRANSLATIONS } from "@/lib/translations";

interface Props {
  onFetched: (verses: Verse[]) => void;
}

interface Segment {
  id: number;
  book: string;
  startChapter: number;
  endChapter: number;
}

let nextId = 1;

function makeSegment(book = "1 Corinthians"): Segment {
  return { id: nextId++, book, startChapter: 1, endChapter: chapterCount(book) };
}

const OT = BOOKS.filter((b) => b.testament === "OT");
const NT = BOOKS.filter((b) => b.testament === "NT");

export default function PassageSelector({ onFetched }: Props) {
  const [translation, setTranslation] = useState("esv");
  const [segments, setSegments] = useState<Segment[]>([makeSegment()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTranslation = TRANSLATIONS.find((t) => t.id === translation)!;

  function updateSegment(id: number, patch: Partial<Omit<Segment, "id">>) {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== id) return seg;
        const updated = { ...seg, ...patch };
        if (updated.startChapter > updated.endChapter) updated.endChapter = updated.startChapter;
        return updated;
      })
    );
  }

  function handleBookChange(id: number, book: string) {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, book, startChapter: 1, endChapter: chapterCount(book) } : seg
      )
    );
  }

  function addSegment() {
    setSegments((prev) => [...prev, makeSegment()]);
  }

  function removeSegment(id: number) {
    setSegments((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }

  async function handleFetch() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/passage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translation,
          segments: segments.map(({ book, startChapter, endChapter }) => ({
            book,
            startChapter,
            endChapter,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      if (!data.verses?.length) throw new Error("No verses returned. Check the passage reference.");
      onFetched(data.verses);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Translation selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Translation</label>
        <div className="flex gap-2 flex-wrap">
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTranslation(t.id)}
              className={`px-3 py-1.5 rounded border text-sm font-medium transition-colors ${
                translation === t.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Passage segments */}
      <div className="space-y-2">
        {segments.map((seg, idx) => {
          const maxChapters = chapterCount(seg.book);
          const chapterNums = Array.from({ length: maxChapters }, (_, i) => i + 1);

          return (
            <div key={seg.id} className="flex flex-wrap gap-3 items-center bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400 w-4 shrink-0">{idx + 1}</span>

              <select
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={seg.book}
                onChange={(e) => handleBookChange(seg.id, e.target.value)}
              >
                <optgroup label="Old Testament">
                  {OT.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </optgroup>
                <optgroup label="New Testament">
                  {NT.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </optgroup>
              </select>

              <span className="text-sm text-gray-500">Ch.</span>

              <select
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                value={seg.startChapter}
                onChange={(e) => updateSegment(seg.id, { startChapter: Number(e.target.value) })}
              >
                {chapterNums.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <span className="text-sm text-gray-500">–</span>

              <select
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                value={seg.endChapter}
                onChange={(e) => updateSegment(seg.id, { endChapter: Number(e.target.value) })}
              >
                {chapterNums.filter((n) => n >= seg.startChapter).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {segments.length > 1 && (
                <button
                  onClick={() => removeSegment(seg.id)}
                  className="text-gray-400 hover:text-red-500 text-lg leading-none ml-auto"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <button
          onClick={addSegment}
          className="border rounded px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          + Add book
        </button>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Fetching…" : `Fetch ${segments.length > 1 ? `${segments.length} books` : "passage"} →`}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-xs text-gray-500">{selectedTranslation.copyright}</p>
    </div>
  );
}
