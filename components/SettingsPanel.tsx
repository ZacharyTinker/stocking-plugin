"use client";

import { TokenizationOptions, DisplayOptions } from "@/types/scripture";

interface Props {
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
  onTokenChange: (opts: TokenizationOptions) => void;
  onDisplayChange: (opts: DisplayOptions) => void;
}

const FONTS = [
  "Georgia, serif",
  "Times New Roman, serif",
  "Arial, sans-serif",
  "Verdana, sans-serif",
  "OpenDyslexic, sans-serif",
  "Lexie Readable, sans-serif",
  "Atkinson Hyperlegible, sans-serif",
];

export default function SettingsPanel({ tokenOpts, displayOpts, onTokenChange, onDisplayChange }: Props) {
  function toggle(key: keyof TokenizationOptions) {
    onTokenChange({ ...tokenOpts, [key]: !tokenOpts[key] });
  }

  return (
    <div className="space-y-6 text-sm">
      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Display</h3>
        <div className="space-y-2">
          <label className="block">
            Font family
            <select
              className="ml-2 border rounded px-2 py-1 text-sm"
              value={displayOpts.fontFamily}
              onChange={(e) => onDisplayChange({ ...displayOpts, fontFamily: e.target.value })}
            >
              {FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f.split(",")[0]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Font size
            <input
              type="range" min={12} max={24} step={1}
              value={displayOpts.fontSize}
              onChange={(e) => onDisplayChange({ ...displayOpts, fontSize: Number(e.target.value) })}
              className="ml-2 align-middle"
            />
            <span className="ml-1">{displayOpts.fontSize}px</span>
          </label>
          <label className="block">
            Line spacing
            <input
              type="range" min={1.2} max={3} step={0.1}
              value={displayOpts.lineSpacing}
              onChange={(e) => onDisplayChange({ ...displayOpts, lineSpacing: Number(e.target.value) })}
              className="ml-2 align-middle"
            />
            <span className="ml-1">{displayOpts.lineSpacing.toFixed(1)}</span>
          </label>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Layout</h3>
        <div className="space-y-1">
          <Checkbox
            label="Show section headings"
            checked={displayOpts.includeSectionHeadings}
            onChange={(v) => onDisplayChange({ ...displayOpts, includeSectionHeadings: v })}
          />
          <Checkbox
            label="Show footnotes (if present in source)"
            checked={displayOpts.includeFootnotes}
            onChange={(v) => onDisplayChange({ ...displayOpts, includeFootnotes: v })}
          />
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Markup</h3>
        <div className="space-y-1">
          <Checkbox label="Bold unique words" checked={tokenOpts.includeUniqueWords} onChange={() => toggle("includeUniqueWords")} />
          <Checkbox label="Underline unique phrases" checked={tokenOpts.includeUniquePhrases} onChange={() => toggle("includeUniquePhrases")} />
          <Checkbox label="Underline 2-word phrases" checked={tokenOpts.analyzeTwoWordPhrases} onChange={() => toggle("analyzeTwoWordPhrases")} />
          <Checkbox label="Underline 3-word phrases" checked={tokenOpts.analyzeThreeWordPhrases} onChange={() => toggle("analyzeThreeWordPhrases")} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Tokenization</h3>
        <div className="space-y-1">
          <Checkbox label="Hyphenated words as single word" checked={tokenOpts.hyphenatedWordsAsSingle} onChange={() => toggle("hyphenatedWordsAsSingle")} />
          <Checkbox label="Contractions as single token" checked={tokenOpts.contractionsAsSingle} onChange={() => toggle("contractionsAsSingle")} />
          <Checkbox label="Include possessives ('s)" checked={tokenOpts.includePossessives} onChange={() => toggle("includePossessives")} />
        </div>
      </section>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
