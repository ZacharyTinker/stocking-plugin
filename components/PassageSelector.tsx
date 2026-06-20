"use client";

import { useState } from "react";
import { Verse } from "@/types/scripture";
import { BOOKS, chapterCount } from "@/lib/bookList";

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
  const chapters = chapterCount(book);
  return { id: nextId++, book, startChapter: 1, endChapter: chapters };
}

const OT = BOOKS.filter((b) => b.testament === "OT");
const NT = BOOKS.filter((b) => b.testament === "NT");

export default function PassageSelector({ onFetched }: Props) {
  const [segments, setSegments] = useState<Segment[]>([makeSegment()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateSegment(id: number, patch: Partial<Omit<Segment, "id">>) {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== id) return seg;
        const updated = { ...seg, ...patch };
        // Keep endChapter >= startChapter
        if (updated.startChapter > updated.endChapter) {
          updated.endChapter = updated.startChapter;
        }
        return updated;
      })
    );
  }

  function handleBookChange(id: number, book: string) {
    const chapters = chapterCount(book);
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, book, startChapter: 1, endChapter: chapters } : seg
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
          provider: "esv",
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
      <div className="space-y-2">
        {segments.map((seg, idx) => {
          const maxChapters = chapterCount(seg.book);
          const chapterNums = Array.from({ length: maxChapters }, (_, i) => i + 1);

          return (
            <div key={seg.id} className="flex flex-wrap gap-3 items-center bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400 w-4 shrink-0">{idx + 1}</span>

              {/* Book */}
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

              {/* Start chapter */}
              <select
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                value={seg.startChapter}
                onChange={(e) => updateSegment(seg.id, { startChapter: Number(e.target.value) })}
              >
                {chapterNums.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <span className="text-sm text-gray-500">–</span>

              {/* End chapter */}
              <select
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                value={seg.endChapter}
                onChange={(e) => updateSegment(seg.id, { endChapter: Number(e.target.value) })}
              >
                {chapterNums.filter((n) => n >= seg.startChapter).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {/* Remove button */}
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

      <p className="text-xs text-gray-500">
        Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway. Used by permission. All rights reserved.
      </p>
    </div>
  );
}
