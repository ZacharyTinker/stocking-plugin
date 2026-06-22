"use client";

import { useRef, useState } from "react";
import { ClubStyle, DEFAULT_CLUB_STYLES, CLUB_COLOR_PALETTE, inferClubRank } from "@/types/scripture";

interface ParsedResult {
  keyVerses: Map<string, string>;   // "Luke 2:52" → "Club 150"
  clubStyles: Record<string, ClubStyle>;
}

interface Props {
  keyVerses: Map<string, string>;
  clubStyles: Record<string, ClubStyle>;
  onLoad: (result: ParsedResult) => void;
  onClear: () => void;
}

function parseCSVRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "").trim()))
    .filter((row) => row.some((c) => c));
}

function normalizeClubName(raw: string): string {
  // Accept "150", "Club150", "Club 150", "club 150" → "Club 150"
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits) return `Club ${digits}`;
  return raw; // keep as-is if no digits (custom club name)
}

function buildResult(
  rows: string[][],
  existingStyles: Record<string, ClubStyle>
): { result: ParsedResult; errors: string[] } {
  const errors: string[] = [];
  const keyVerses = new Map<string, string>();
  const seenClubs = new Set<string>();

  // Find header row — look for "book" column
  let dataStart = 0;
  const firstLower = rows[0]?.map((c) => c.toLowerCase()) ?? [];
  if (firstLower.includes("book") || firstLower.includes("chapter") || firstLower.includes("verse")) {
    dataStart = 1;
  }

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    // Support: Book, Chapter, Verse[, Club]
    const [book, chapterRaw, verseRaw, clubRaw] = row;
    const chapter = parseInt(chapterRaw, 10);
    const verse = parseInt(verseRaw, 10);

    if (!book || isNaN(chapter) || isNaN(verse)) {
      errors.push(`Row ${i + 1}: invalid data "${row.join(", ")}"`);
      continue;
    }

    const club = normalizeClubName(clubRaw?.trim() || "Club 150");
    const id = `${book.trim()} ${chapter}:${verse}`;
    keyVerses.set(id, club);
    seenClubs.add(club);
  }

  // Build clubStyles: keep existing, fill in defaults/auto for new clubs
  const clubStyles: Record<string, ClubStyle> = { ...existingStyles };
  let colorIdx = Object.keys(clubStyles).length;
  let fallbackIdx = 0;
  for (const club of seenClubs) {
    if (!clubStyles[club]) {
      clubStyles[club] =
        DEFAULT_CLUB_STYLES[club] ??
        { indicator: "filled", color: CLUB_COLOR_PALETTE[colorIdx++ % CLUB_COLOR_PALETTE.length], rank: inferClubRank(club, fallbackIdx++) };
    }
  }

  return { result: { keyVerses, clubStyles }, errors };
}

export default function KeyVerseUpload({ keyVerses, clubStyles, onLoad, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setErrors([]);
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      let rows: string[][];

      if (ext === "xlsx" || ext === "xls" || ext === "ods") {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_csv(ws).split(/\r?\n/).map((l) =>
          l.split(",").map((c) => c.trim().replace(/^"|"$/g, "").trim())
        ).filter((r) => r.some((c) => c));
      } else {
        const text = await file.text();
        rows = parseCSVRows(text);
      }

      const { result, errors: errs } = buildResult(rows, clubStyles);
      setErrors(errs);
      if (result.keyVerses.size > 0) onLoad(result);
      else if (!errs.length) setErrors(["No valid verse rows found."]);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Failed to parse file."]);
    }
  }

  const clubNames = [...new Set(keyVerses.values())].sort();

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => inputRef.current?.click()}
          className="border rounded px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Upload CSV / Excel
        </button>
        {keyVerses.size > 0 && (
          <button
            onClick={() => { onClear(); setFileName(""); setErrors([]); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear
          </button>
        )}
        {fileName && (
          <span className="text-xs text-gray-500">{fileName} — {keyVerses.size} verses loaded</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.ods"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      {errors.length > 0 && (
        <div className="text-xs text-red-600 space-y-0.5">
          {errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
          {errors.length > 5 && <p>…and {errors.length - 5} more errors</p>}
        </div>
      )}

      {clubNames.length > 0 && (
        <p className="text-xs text-gray-500">
          Clubs: {clubNames.map((c) => `${c} (${[...keyVerses.values()].filter((v) => v === c).length})`).join(" · ")}
        </p>
      )}

      <p className="text-xs text-gray-400">
        Expected columns: <code>Book, Chapter, Verse, Club</code> — Club column optional (defaults to "Club 150").
        Club can be "75", "150", "300", "Club 150", or any custom name.
      </p>
    </div>
  );
}
