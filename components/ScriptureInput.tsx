"use client";

import { useState } from "react";
import { Verse } from "@/types/scripture";
import { parsePlainText, parseJSON } from "@/lib/parse";

interface Props {
  onParsed: (verses: Verse[]) => void;
}

const SAMPLE = `[Greeting]
1:1 Paul, called to be an apostle of Christ Jesus by the will of God, and our brother Sosthenes,
1:2 To the church of God in Corinth, to those sanctified in Christ Jesus and called to be his holy people, together with all those everywhere who call on the name of our Lord Jesus Christ—their Lord and ours:
1:3 Grace and peace to you from God our Father and the Lord Jesus Christ.
[Thanksgiving]
1:4 I always thank my God for you because of his grace given you in Christ Jesus.
1:5 For in him you have been enriched in every way—with all kinds of speech and with all knowledge—
1:6 God thus confirming our testimony about Christ among you.`;

export default function ScriptureInput({ onParsed }: Props) {
  const [bookName, setBookName] = useState("1 Corinthians");
  const [text, setText] = useState(SAMPLE);
  const [inputMode, setInputMode] = useState<"text" | "json">("text");
  const [error, setError] = useState("");

  function handleParse() {
    setError("");
    try {
      let verses: Verse[];
      if (inputMode === "json") {
        verses = parseJSON(text);
      } else {
        if (!bookName.trim()) { setError("Please enter a book name."); return; }
        verses = parsePlainText(bookName.trim(), text);
      }
      if (verses.length === 0) { setError("No verses found. Check the format."); return; }
      onParsed(verses);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Parse error");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
      if (file.name.endsWith(".json")) setInputMode("json");
      else setInputMode("text");
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="text" checked={inputMode === "text"} onChange={() => setInputMode("text")} />
          Plain text (chapter:verse format)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="json" checked={inputMode === "json"} onChange={() => setInputMode("json")} />
          JSON array
        </label>
      </div>

      {inputMode === "text" && (
        <div>
          <label className="block text-sm font-medium mb-1">Book name</label>
          <input
            className="border rounded px-3 py-1.5 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="e.g. 1 Corinthians"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Scripture text{" "}
          <span className="font-normal text-gray-500">
            (paste licensed text or upload a file)
          </span>
        </label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm font-mono h-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={inputMode === "text" ? "1:1 Verse text here...\n[Section Heading]\n1:2 Next verse..." : '[{"book":"...","chapter":1,"verse":1,"text":"..."}]'}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm cursor-pointer text-blue-600 underline">
          Upload file (.txt / .json)
          <input type="file" accept=".txt,.json" className="hidden" onChange={handleFile} />
        </label>
        <button
          onClick={handleParse}
          className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Parse Scripture →
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="text-xs text-gray-500 border-t pt-3">
        <strong>Plain-text format:</strong> Each verse on its own line as{" "}
        <code>chapter:verse text</code>. Optional section headings in{" "}
        <code>[square brackets]</code> on their own line.
        <br />
        <strong>Licensing:</strong> Only paste or upload Scripture text you are
        licensed to use.
      </div>
    </div>
  );
}
