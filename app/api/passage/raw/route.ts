/**
 * Debug endpoint — returns the raw ESV API text for a passage.
 * Use this to inspect exactly what markers appear in the response.
 * Example: /api/passage/raw?book=Galatians&startChapter=1&endChapter=1
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const book = searchParams.get("book") ?? "Galatians";
  const startChapter = searchParams.get("startChapter") ?? "1";
  const endChapter = searchParams.get("endChapter") ?? "1";

  const apiKey = process.env.ESV_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ESV_API_KEY not set" }, { status: 500 });

  const query = `${book} ${startChapter}:1-${endChapter}:999`;
  const url = `https://api.esv.org/v3/passage/text/?${new URLSearchParams({
    q: query,
    "include-passage-references": "false",
    "include-verse-numbers": "true",
    "include-first-verse-numbers": "true",
    "include-footnotes": "false",
    "include-footnote-body": "false",
    "include-cross-references": "false",
    "include-headings": "true",
    "include-short-copyright": "false",
    "include-copyright": "false",
    "include-passage-horizontal-lines": "false",
    "include-heading-horizontal-lines": "false",
    "indent-paragraphs": "0",
    "indent-poetry": "false",
    "line-length": "0",
  })}`;

  const res = await fetch(url, { headers: { Authorization: `Token ${apiKey}` }, cache: "no-store" });
  const data = await res.json();

  return NextResponse.json({ raw: data.passages?.[0] ?? null }, { status: res.status });
}
