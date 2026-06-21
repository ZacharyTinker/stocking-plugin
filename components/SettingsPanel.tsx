"use client";

import { TokenizationOptions, DisplayOptions, MarkupStyle, ElementStyle, ClubStyle } from "@/types/scripture";
import ClubStylePicker from "@/components/ClubStylePicker";

interface Props {
  tokenOpts: TokenizationOptions;
  displayOpts: DisplayOptions;
  onTokenChange: (opts: TokenizationOptions) => void;
  onDisplayChange: (opts: DisplayOptions) => void;
  clubStyles: Record<string, ClubStyle>;
  keyVerses: Map<string, string>;
  onClubStylesChange: (s: Record<string, ClubStyle>) => void;
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

export default function SettingsPanel({ tokenOpts, displayOpts, onTokenChange, onDisplayChange, clubStyles, keyVerses, onClubStylesChange }: Props) {
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
        <div className="space-y-1 mb-4">
          <Checkbox label="Mark unique words" checked={tokenOpts.includeUniqueWords} onChange={() => toggle("includeUniqueWords")} />
          <Checkbox label="Mark unique phrases" checked={tokenOpts.includeUniquePhrases} onChange={() => toggle("includeUniquePhrases")} />
          <Checkbox label="Include 2-word phrases" checked={tokenOpts.analyzeTwoWordPhrases} onChange={() => toggle("analyzeTwoWordPhrases")} />
          <Checkbox label="Include 3-word phrases" checked={tokenOpts.analyzeThreeWordPhrases} onChange={() => toggle("analyzeThreeWordPhrases")} />
        </div>
        {tokenOpts.includeUniqueWords && (
          <StylePicker
            label="Unique word style"
            value={displayOpts.wordStyle}
            onChange={(s) => onDisplayChange({ ...displayOpts, wordStyle: s })}
            baseFontSize={displayOpts.fontSize}
          />
        )}
        {tokenOpts.includeUniquePhrases && (
          <StylePicker
            label="Unique phrase style"
            value={displayOpts.phraseStyle}
            onChange={(s) => onDisplayChange({ ...displayOpts, phraseStyle: s })}
            baseFontSize={displayOpts.fontSize}
          />
        )}
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Headings &amp; Elements</h3>
        <div className="space-y-1 mb-3">
          <Checkbox
            label="Page break before each chapter (export only)"
            checked={displayOpts.chapterPageBreak}
            onChange={(v) => onDisplayChange({ ...displayOpts, chapterPageBreak: v })}
          />
        </div>
        <ElementStylePicker
          label="Book title"
          value={displayOpts.bookTitleStyle}
          onChange={(s) => onDisplayChange({ ...displayOpts, bookTitleStyle: s })}
        />
        <ElementStylePicker
          label="Chapter heading"
          value={displayOpts.chapterHeadingStyle}
          onChange={(s) => onDisplayChange({ ...displayOpts, chapterHeadingStyle: s })}
        />
        {displayOpts.includeSectionHeadings && (
          <ElementStylePicker
            label="Section heading"
            value={displayOpts.sectionHeadingStyle}
            onChange={(s) => onDisplayChange({ ...displayOpts, sectionHeadingStyle: s })}
          />
        )}
        <ElementStylePicker
          label="Verse number"
          value={displayOpts.verseNumberStyle}
          onChange={(s) => onDisplayChange({ ...displayOpts, verseNumberStyle: s })}
        />
      </section>

      {Object.keys(clubStyles).length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-700 mb-2">Key Verse Indicators</h3>
          {Object.entries(clubStyles)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([club, style]) => {
              const count = [...keyVerses.values()].filter((v) => v === club).length;
              return (
                <ClubStylePicker
                  key={club}
                  club={club}
                  style={style}
                  count={count}
                  onChange={(s) => onClubStylesChange({ ...clubStyles, [club]: s })}
                />
              );
            })}
        </section>
      )}

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

const HIGHLIGHT_PRESETS = ["", "#ffff00", "#90ee90", "#add8e6", "#ffb6c1", "#ffa500", "#e0b0ff"];
const COLOR_PRESETS = ["", "#000000", "#cc0000", "#006600", "#00008b", "#8b4513", "#555555"];

function ElementStylePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ElementStyle;
  onChange: (s: ElementStyle) => void;
}) {
  function patch(p: Partial<ElementStyle>) {
    onChange({ ...value, ...p });
  }

  const previewStyle: React.CSSProperties = {
    fontWeight: value.bold ? "bold" : "normal",
    fontStyle: value.italic ? "italic" : "normal",
    textDecoration: value.underline ? "underline" : undefined,
    backgroundColor: value.highlight || undefined,
    color: value.color || undefined,
    fontSize: `${value.fontSize}px`,
  };

  return (
    <div className="mt-2 mb-2 border rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">{label}</span>
        <span style={previewStyle} className="border px-2 py-0.5 rounded bg-white">
          Sample
        </span>
      </div>

      <div className="flex gap-3 flex-wrap text-sm">
        {(["bold", "italic", "underline"] as const).map((prop) => (
          <label key={prop} className="flex items-center gap-1 cursor-pointer capitalize">
            <input type="checkbox" checked={value[prop]} onChange={(e) => patch({ [prop]: e.target.checked })} />
            {prop}
          </label>
        ))}
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="number"
            min={8}
            max={72}
            step={1}
            value={value.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            className="w-14 border rounded px-1 py-0.5 text-xs"
          />
          <span className="text-xs text-gray-600">px size</span>
        </label>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-gray-500">Highlight</span>
        <div className="flex gap-1 flex-wrap">
          {HIGHLIGHT_PRESETS.map((c) => (
            <button key={c || "none"} onClick={() => patch({ highlight: c })} title={c || "None"}
              className={`w-6 h-6 rounded border-2 ${value.highlight === c ? "border-blue-500" : "border-gray-300"}`}
              style={{ backgroundColor: c || "transparent" }}>
              {!c && <span className="text-gray-400 text-xs leading-none">✕</span>}
            </button>
          ))}
          <input type="color" value={value.highlight || "#ffffff"} onChange={(e) => patch({ highlight: e.target.value })}
            title="Custom highlight" className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0" />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-gray-500">Text color</span>
        <div className="flex gap-1 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c || "none"} onClick={() => patch({ color: c })} title={c || "Default"}
              className={`w-6 h-6 rounded border-2 ${value.color === c ? "border-blue-500" : "border-gray-300"}`}
              style={{ backgroundColor: c || "transparent" }}>
              {!c && <span className="text-gray-400 text-xs leading-none">✕</span>}
            </button>
          ))}
          <input type="color" value={value.color || "#000000"} onChange={(e) => patch({ color: e.target.value })}
            title="Custom text color" className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0" />
        </div>
      </div>
    </div>
  );
}

function StylePicker({
  label,
  value,
  onChange,
  baseFontSize,
}: {
  label: string;
  value: MarkupStyle;
  onChange: (s: MarkupStyle) => void;
  baseFontSize: number;
}) {
  function patch(p: Partial<MarkupStyle>) {
    onChange({ ...value, ...p });
  }

  const previewStyle: React.CSSProperties = {
    fontWeight: value.bold ? "bold" : undefined,
    fontStyle: value.italic ? "italic" : undefined,
    textDecoration: value.underline ? "underline" : undefined,
    backgroundColor: value.highlight || undefined,
    color: value.color || undefined,
    fontSize: `${baseFontSize + value.sizeBoost}px`,
  };

  return (
    <div className="mt-3 mb-3 border rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">{label}</span>
        <span style={previewStyle} className="border px-2 py-0.5 rounded bg-white text-sm">
          Sample text
        </span>
      </div>

      {/* Toggle row */}
      <div className="flex gap-3 flex-wrap text-sm">
        {(["bold", "italic", "underline"] as const).map((prop) => (
          <label key={prop} className="flex items-center gap-1 cursor-pointer capitalize">
            <input type="checkbox" checked={value[prop]} onChange={(e) => patch({ [prop]: e.target.checked })} />
            {prop}
          </label>
        ))}
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="number"
            min={0}
            max={12}
            step={1}
            value={value.sizeBoost}
            onChange={(e) => patch({ sizeBoost: Number(e.target.value) })}
            className="w-12 border rounded px-1 py-0.5 text-xs"
          />
          <span className="text-xs text-gray-600">+px size</span>
        </label>
      </div>

      {/* Highlight swatches */}
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Highlight</span>
        <div className="flex gap-1 flex-wrap">
          {HIGHLIGHT_PRESETS.map((c) => (
            <button
              key={c || "none"}
              onClick={() => patch({ highlight: c })}
              title={c || "None"}
              className={`w-6 h-6 rounded border-2 ${value.highlight === c ? "border-blue-500" : "border-gray-300"}`}
              style={{ backgroundColor: c || "transparent" }}
            >
              {!c && <span className="text-gray-400 text-xs leading-none">✕</span>}
            </button>
          ))}
          <input
            type="color"
            value={value.highlight || "#ffffff"}
            onChange={(e) => patch({ highlight: e.target.value })}
            title="Custom highlight color"
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
          />
        </div>
      </div>

      {/* Text color swatches */}
      <div className="space-y-1">
        <span className="text-xs text-gray-500">Text color</span>
        <div className="flex gap-1 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c || "none"}
              onClick={() => patch({ color: c })}
              title={c || "Default"}
              className={`w-6 h-6 rounded border-2 ${value.color === c ? "border-blue-500" : "border-gray-300"}`}
              style={{ backgroundColor: c || "transparent" }}
            >
              {!c && <span className="text-gray-400 text-xs leading-none">✕</span>}
            </button>
          ))}
          <input
            type="color"
            value={value.color || "#000000"}
            onChange={(e) => patch({ color: e.target.value })}
            title="Custom text color"
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
          />
        </div>
      </div>
    </div>
  );
}
