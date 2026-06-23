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
      <div>
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-2">Format</p>
        <div className="segment-control">
          <button className={`segment-btn ${inputMode === "text" ? "active" : ""}`} onClick={() => setInputMode("text")}>
            Plain text
          </button>
          <button className={`segment-btn ${inputMode === "json" ? "active" : ""}`} onClick={() => setInputMode("json")}>
            JSON
          </button>
        </div>
      </div>

      {inputMode === "text" && (
        <div>
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Book name</p>
          <input
            className="bq-input"
            style={{ maxWidth: "260px" }}
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="e.g. 1 Corinthians"
          />
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Scripture text</p>
        <textarea
          className="bq-input font-mono h-52"
          style={{ resize: "vertical" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={inputMode === "text" ? "1:1 Verse text here...\n[Section Heading]\n1:2 Next verse..." : '[{"book":"...","chapter":1,"verse":1,"text":"..."}]'}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="btn-secondary text-sm cursor-pointer">
          📁 Upload file
          <input type="file" accept=".txt,.json" className="hidden" onChange={handleFile} />
        </label>
        <button onClick={handleParse} className="btn-primary">
          Parse Scripture →
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
             style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", color: "#be123c" }}>
          ⚠️ {error}
        </div>
      )}

      <p className="text-xs text-violet-400">
        Each verse on its own line as <code className="bg-violet-100 px-1 rounded">chapter:verse text</code>.
        Optional section headings in <code className="bg-violet-100 px-1 rounded">[square brackets]</code>.
        Only paste Scripture you are licensed to use.
      </p>
    </div>
  );
}
