"use client";

import { useState } from "react";
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

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #ede9fe" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        style={{ background: open ? "#ede9fe" : "white" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-bold text-violet-800">{title}</span>
        </div>
        <span className="text-violet-400 text-xs font-bold transition-transform"
              style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
      </button>
      {open && (
        <div className="px-4 py-4 space-y-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-violet-900 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#7c3aed", width: "15px", height: "15px" }}
      />
      {label}
    </label>
  );
}

const HIGHLIGHT_PRESETS = ["", "#ffff00", "#90ee90", "#add8e6", "#ffb6c1", "#ffa500", "#e0b0ff"];
const COLOR_PRESETS = ["", "#000000", "#cc0000", "#006600", "#00008b", "#8b4513", "#555555"];

function SwatchRow({ label, presets, selected, onChange }: {
  label: string;
  presets: string[];
  selected: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {presets.map((c, i) => (
          <button
            key={i}
            onClick={() => onChange(c)}
            title={c || "None / Default"}
            className="w-6 h-6 rounded-lg transition-all flex items-center justify-center"
            style={{
              backgroundColor: c || "white",
              border: selected === c ? "2.5px solid #7c3aed" : "1.5px solid #ddd6fe",
              boxShadow: selected === c ? "0 0 0 2px #ede9fe" : undefined,
            }}
          >
            {!c && <span className="text-violet-300 text-xs leading-none">✕</span>}
          </button>
        ))}
        <input
          type="color"
          value={selected || (label === "Highlight" ? "#ffffff" : "#000000")}
          onChange={(e) => onChange(e.target.value)}
          title="Custom"
          className="w-6 h-6 rounded-lg cursor-pointer p-0"
          style={{ border: "1.5px solid #ddd6fe" }}
        />
      </div>
    </div>
  );
}

function StylePickerBox({ children, label, preview }: {
  children: React.ReactNode; label: string; preview: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-3 space-y-3" style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">{label}</span>
        {preview}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ value, onChange }: {
  value: { bold: boolean; italic: boolean; underline: boolean };
  onChange: (p: { bold?: boolean; italic?: boolean; underline?: boolean }) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {(["bold", "italic", "underline"] as const).map((prop) => (
        <button
          key={prop}
          onClick={() => onChange({ [prop]: !value[prop] })}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
          style={value[prop] ? {
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white",
            boxShadow: "0 2px 8px rgba(124,58,237,0.25)"
          } : {
            background: "white", color: "#6d28d9", border: "1.5px solid #ddd6fe"
          }}
        >
          {prop}
        </button>
      ))}
    </div>
  );
}

function ElementStylePicker({ label, value, onChange, showSuperscript = false }: {
  label: string; value: ElementStyle; onChange: (s: ElementStyle) => void; showSuperscript?: boolean;
}) {
  function patch(p: Partial<ElementStyle>) { onChange({ ...value, ...p }); }
  const previewStyle: React.CSSProperties = {
    fontWeight: value.bold ? "bold" : "normal",
    fontStyle: value.italic ? "italic" : "normal",
    textDecoration: value.underline ? "underline" : undefined,
    backgroundColor: value.highlight || undefined,
    color: value.color || undefined,
    fontSize: `${value.fontSize}px`,
  };
  return (
    <StylePickerBox
      label={label}
      preview={
        <span style={{ ...previewStyle, background: previewStyle.backgroundColor ?? "white", border: "1px solid #ede9fe" }}
              className="rounded-lg px-2 py-0.5 text-xs">
          Sample
        </span>
      }
    >
      <ToggleRow value={value} onChange={patch} />
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-violet-500 font-semibold">Size</span>
          <input
            type="number" min={8} max={72} step={1} value={value.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            className="bq-input text-xs text-center"
            style={{ width: "56px" }}
          />
          <span className="text-xs text-violet-400">px</span>
        </div>
        {showSuperscript && (
          <Checkbox
            label="Superscript"
            checked={value.superscript !== false}
            onChange={(v) => patch({ superscript: v })}
          />
        )}
      </div>
      <SwatchRow label="Highlight" presets={HIGHLIGHT_PRESETS} selected={value.highlight ?? ""} onChange={(c) => patch({ highlight: c })} />
      <SwatchRow label="Text Color" presets={COLOR_PRESETS} selected={value.color ?? ""} onChange={(c) => patch({ color: c })} />
    </StylePickerBox>
  );
}

function StylePicker({ label, value, onChange, baseFontSize }: {
  label: string; value: MarkupStyle; onChange: (s: MarkupStyle) => void; baseFontSize: number;
}) {
  function patch(p: Partial<MarkupStyle>) { onChange({ ...value, ...p }); }
  const previewStyle: React.CSSProperties = {
    fontWeight: value.bold ? "bold" : undefined,
    fontStyle: value.italic ? "italic" : undefined,
    textDecoration: value.underline ? "underline" : undefined,
    backgroundColor: value.highlight || undefined,
    color: value.color || undefined,
    fontSize: `${baseFontSize + value.sizeBoost}px`,
  };
  return (
    <StylePickerBox
      label={label}
      preview={<span style={previewStyle} className="rounded-lg px-2 py-0.5 text-xs bg-white border border-violet-100">Sample</span>}
    >
      <ToggleRow value={value} onChange={patch} />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-violet-500 font-semibold">+Size</span>
        <input
          type="number" min={0} max={12} step={1} value={value.sizeBoost}
          onChange={(e) => patch({ sizeBoost: Number(e.target.value) })}
          className="bq-input text-xs text-center"
          style={{ width: "56px" }}
        />
        <span className="text-xs text-violet-400">px</span>
      </div>
      <SwatchRow label="Highlight" presets={HIGHLIGHT_PRESETS} selected={value.highlight ?? ""} onChange={(c) => patch({ highlight: c })} />
      <SwatchRow label="Text Color" presets={COLOR_PRESETS} selected={value.color ?? ""} onChange={(c) => patch({ color: c })} />
    </StylePickerBox>
  );
}

export default function SettingsPanel({ tokenOpts, displayOpts, onTokenChange, onDisplayChange, clubStyles, keyVerses, onClubStylesChange }: Props) {
  function toggle(key: keyof TokenizationOptions) {
    onTokenChange({ ...tokenOpts, [key]: !tokenOpts[key] });
  }

  return (
    <div className="space-y-3 text-sm">

      <Section title="Display" icon="🎨">
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1.5">Font family</p>
          <select
            className="bq-select w-full"
            value={displayOpts.fontFamily}
            onChange={(e) => onDisplayChange({ ...displayOpts, fontFamily: e.target.value })}
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f.split(",")[0]}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Font size</p>
            <span className="bq-badge">{displayOpts.fontSize}px</span>
          </div>
          <input
            type="range" min={12} max={24} step={1}
            value={displayOpts.fontSize}
            onChange={(e) => onDisplayChange({ ...displayOpts, fontSize: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: "#7c3aed" }}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Line spacing</p>
            <span className="bq-badge">{displayOpts.lineSpacing.toFixed(1)}</span>
          </div>
          <input
            type="range" min={1.2} max={3} step={0.1}
            value={displayOpts.lineSpacing}
            onChange={(e) => onDisplayChange({ ...displayOpts, lineSpacing: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: "#7c3aed" }}
          />
        </div>
      </Section>

      <Section title="Layout" icon="📐">
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">Verse layout</p>
          <div className="segment-control">
            {([["lines", "Verse per line"], ["paragraph", "Paragraph"]] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => onDisplayChange({ ...displayOpts, verseLayout: mode })}
                className={`segment-btn ${displayOpts.verseLayout === mode ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Checkbox label="Show section headings" checked={displayOpts.includeSectionHeadings} onChange={(v) => onDisplayChange({ ...displayOpts, includeSectionHeadings: v })} />
        <Checkbox label="Show footnotes" checked={displayOpts.includeFootnotes} onChange={(v) => onDisplayChange({ ...displayOpts, includeFootnotes: v })} />
        <Checkbox label="Page break before each chapter (export)" checked={displayOpts.chapterPageBreak} onChange={(v) => onDisplayChange({ ...displayOpts, chapterPageBreak: v })} />
      </Section>

      <Section title="Markup" icon="✍️">
        <div className="space-y-2">
          <Checkbox label="Mark unique words" checked={tokenOpts.includeUniqueWords} onChange={() => toggle("includeUniqueWords")} />
          <Checkbox label="Mark unique phrases" checked={tokenOpts.includeUniquePhrases} onChange={() => toggle("includeUniquePhrases")} />
          <Checkbox label="Analyze 2-word phrases" checked={tokenOpts.analyzeTwoWordPhrases} onChange={() => toggle("analyzeTwoWordPhrases")} />
          <Checkbox label="Analyze 3-word phrases" checked={tokenOpts.analyzeThreeWordPhrases} onChange={() => toggle("analyzeThreeWordPhrases")} />
        </div>
        <div className="space-y-2 mt-1">
          {tokenOpts.includeUniqueWords && (
            <StylePicker label="Unique word style" value={displayOpts.wordStyle} onChange={(s) => onDisplayChange({ ...displayOpts, wordStyle: s })} baseFontSize={displayOpts.fontSize} />
          )}
          {tokenOpts.includeUniquePhrases && tokenOpts.analyzeTwoWordPhrases && (
            <StylePicker label="2-word phrase style" value={displayOpts.phrase2Style} onChange={(s) => onDisplayChange({ ...displayOpts, phrase2Style: s })} baseFontSize={displayOpts.fontSize} />
          )}
          {tokenOpts.includeUniquePhrases && tokenOpts.analyzeThreeWordPhrases && (
            <StylePicker label="3-word phrase style" value={displayOpts.phrase3Style} onChange={(s) => onDisplayChange({ ...displayOpts, phrase3Style: s })} baseFontSize={displayOpts.fontSize} />
          )}
        </div>
      </Section>

      <Section title="Headings &amp; Elements" icon="🏷️" defaultOpen={false}>
        <div className="space-y-2">
          <ElementStylePicker label="Book title" value={displayOpts.bookTitleStyle} onChange={(s) => onDisplayChange({ ...displayOpts, bookTitleStyle: s })} />
          <ElementStylePicker label="Chapter heading" value={displayOpts.chapterHeadingStyle} onChange={(s) => onDisplayChange({ ...displayOpts, chapterHeadingStyle: s })} />
          {displayOpts.includeSectionHeadings && (
            <ElementStylePicker label="Section heading" value={displayOpts.sectionHeadingStyle} onChange={(s) => onDisplayChange({ ...displayOpts, sectionHeadingStyle: s })} />
          )}
          <ElementStylePicker label="Verse number" value={displayOpts.verseNumberStyle} onChange={(s) => onDisplayChange({ ...displayOpts, verseNumberStyle: s })} showSuperscript />
        </div>
      </Section>

      {Object.keys(clubStyles).length > 0 && (
        <Section title="Key Verse Indicators" icon="🏆" defaultOpen={true}>
          <p className="text-xs text-violet-400">Order clubs from smallest (most nested) to largest. The legend follows this order.</p>
          <div className="space-y-2">
            {(() => {
              const ordered = Object.entries(clubStyles).sort(([, a], [, b]) => a.rank - b.rank);
              function move(index: number, dir: -1 | 1) {
                const target = index + dir;
                if (target < 0 || target >= ordered.length) return;
                const [clubA, styleA] = ordered[index];
                const [clubB, styleB] = ordered[target];
                onClubStylesChange({ ...clubStyles, [clubA]: { ...styleA, rank: styleB.rank }, [clubB]: { ...styleB, rank: styleA.rank } });
              }
              return ordered.map(([club, style], i) => {
                const count = [...keyVerses.values()].filter((v) => v === club).length;
                return (
                  <div key={club} className="flex items-start gap-2">
                    <div className="flex flex-col gap-0.5 mt-3 shrink-0">
                      <button onClick={() => move(i, -1)} disabled={i === 0}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all disabled:opacity-25"
                        style={{ background: i === 0 ? "#f5f3ff" : "#ede9fe", color: "#6d28d9" }}>
                        ▲
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === ordered.length - 1}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all disabled:opacity-25"
                        style={{ background: i === ordered.length - 1 ? "#f5f3ff" : "#ede9fe", color: "#6d28d9" }}>
                        ▼
                      </button>
                    </div>
                    <div className="flex-1">
                      <ClubStylePicker club={club} style={style} count={count} onChange={(s) => onClubStylesChange({ ...clubStyles, [club]: s })} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Section>
      )}

      <Section title="Tokenization" icon="⚙️" defaultOpen={false}>
        <div className="space-y-2">
          <Checkbox label="Hyphenated words as single token" checked={tokenOpts.hyphenatedWordsAsSingle} onChange={() => toggle("hyphenatedWordsAsSingle")} />
          <Checkbox label="Contractions as single token" checked={tokenOpts.contractionsAsSingle} onChange={() => toggle("contractionsAsSingle")} />
          <Checkbox label="Include possessives ('s)" checked={tokenOpts.includePossessives} onChange={() => toggle("includePossessives")} />
        </div>
      </Section>

    </div>
  );
}
