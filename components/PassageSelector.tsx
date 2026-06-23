"use client";

import { useState, useEffect } from "react";
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

function makeSegment(book = "John"): Segment {
  return { id: nextId++, book, startChapter: 1, endChapter: chapterCount(book) };
}

const OT = BOOKS.filter((b) => b.testament === "OT");
const NT = BOOKS.filter((b) => b.testament === "NT");

const PS_KEY = "bq-passage-selector";

export default function PassageSelector({ onFetched }: Props) {
  const [translation, setTranslation] = useState("esv");
  const [segments, setSegments] = useState<Segment[]>([makeSegment()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.translation) setTranslation(data.translation);
        if (Array.isArray(data.segments) && data.segments.length > 0) {
          setSegments(data.segments.map((s: Omit<Segment, "id">) => ({ ...s, id: nextId++ })));
        }
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  // Persist on change (only after initial restore)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(PS_KEY, JSON.stringify({
        translation,
        segments: segments.map(({ book, startChapter, endChapter }) => ({ book, startChapter, endChapter })),
      }));
    } catch { /* ignore */ }
  }, [ready, translation, segments]);

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
          segments: segments.map(({ book, startChapter, endChapter }) => ({ book, startChapter, endChapter })),
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
      {/* Translation */}
      <div>
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-2">Translation</p>
        <div className="flex gap-2 flex-wrap">
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTranslation(t.id)}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border"
              style={translation === t.id ? {
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "white",
                border: "1.5px solid transparent",
                boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
              } : {
                background: "white",
                color: "#6d28d9",
                border: "1.5px solid #ddd6fe",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Segments */}
      <div>
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-2">Passage</p>
        <div className="space-y-2">
          {segments.map((seg, idx) => {
            const maxChapters = chapterCount(seg.book);
            const chapterNums = Array.from({ length: maxChapters }, (_, i) => i + 1);

            return (
              <div key={seg.id}
                   className="flex flex-wrap gap-2 items-center rounded-xl px-3 py-2.5"
                   style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
                {segments.length > 1 && (
                  <span className="text-xs font-bold text-violet-400 w-5 shrink-0">{idx + 1}</span>
                )}

                <select
                  className="bq-select flex-1 min-w-32"
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

                <span className="text-xs font-semibold text-violet-400">Ch.</span>

                <select
                  className="bq-select w-16"
                  value={seg.startChapter}
                  onChange={(e) => updateSegment(seg.id, { startChapter: Number(e.target.value) })}
                >
                  {chapterNums.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>

                <span className="text-violet-300 font-bold">–</span>

                <select
                  className="bq-select w-16"
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
                    className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-violet-300 hover:text-red-400 hover:bg-red-50 transition-all text-lg font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <button
          onClick={addSegment}
          className="btn-secondary text-sm"
        >
          + Add book
        </button>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="btn-primary"
          style={{ minWidth: "140px" }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: "spin 0.7s linear infinite" }} />
              Fetching…
            </span>
          ) : (
            `Fetch ${segments.length > 1 ? `${segments.length} books` : "passage"} →`
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
             style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", color: "#be123c" }}>
          ⚠️ {error}
        </div>
      )}

      <p className="text-xs text-violet-400">{selectedTranslation.copyright}</p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
