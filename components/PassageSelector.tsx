"use client";

import { useState } from "react";
import { Verse } from "@/types/scripture";
import { BOOKS, chapterCount } from "@/lib/bookList";

interface Props {
  onFetched: (verses: Verse[]) => void;
}

type Provider = "esv"; // extend here when api.bible is added

export default function PassageSelector({ onFetched }: Props) {
  const [provider] = useState<Provider>("esv");
  const [book, setBook] = useState("1 Corinthians");
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxChapters = chapterCount(book);
  const chapterNums = Array.from({ length: maxChapters }, (_, i) => i + 1);

  function handleBookChange(name: string) {
    setBook(name);
    setStartChapter(1);
    setEndChapter(1);
  }

  function handleStartChapterChange(ch: number) {
    setStartChapter(ch);
    if (endChapter < ch) setEndChapter(ch);
  }

  async function handleFetch() {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({
        provider,
        book,
        startChapter: String(startChapter),
        endChapter: String(endChapter),
      });
      const res = await fetch(`/api/passage?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      if (!data.verses || data.verses.length === 0) throw new Error("No verses returned. Check the passage reference.");
      onFetched(data.verses);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const OT = BOOKS.filter((b) => b.testament === "OT");
  const NT = BOOKS.filter((b) => b.testament === "NT");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Translation badge — ESV only for now */}
        <div>
          <label className="block text-sm font-medium mb-1">Translation</label>
          <div className="border rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-700 w-28 text-center">
            ESV
          </div>
        </div>

        {/* Book */}
        <div>
          <label className="block text-sm font-medium mb-1">Book</label>
          <select
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={book}
            onChange={(e) => handleBookChange(e.target.value)}
          >
            <optgroup label="Old Testament">
              {OT.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
            </optgroup>
            <optgroup label="New Testament">
              {NT.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Start chapter */}
        <div>
          <label className="block text-sm font-medium mb-1">From chapter</label>
          <select
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startChapter}
            onChange={(e) => handleStartChapterChange(Number(e.target.value))}
          >
            {chapterNums.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* End chapter */}
        <div>
          <label className="block text-sm font-medium mb-1">To chapter</label>
          <select
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endChapter}
            onChange={(e) => setEndChapter(Number(e.target.value))}
          >
            {chapterNums.filter((n) => n >= startChapter).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Fetch passage →"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-xs text-gray-500">
        Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
      </p>
    </div>
  );
}
