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
        <div className="px-4 py-4 space-y-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function Labeled({ label, hint, children, disabled }: {
  label: string; hint: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40 pointer-events-none" : ""}>
      <p className="text-sm font-semibold text-violet-800 mb-0.5">{label}</p>
      <p className="text-xs text-violet-400 mb-2">{hint}</p>
      {children}
    </div>
  );
}

function Checkbox({ label, hint, checked, onChange, disabled }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40 pointer-events-none" : ""}>
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ accentColor: "#7c3aed", width: "15px", height: "15px", marginTop: "2px", flexShrink: 0 }}
        />
        <div>
          <span className="text-sm font-semibold text-violet-800">{label}</span>
          {hint && <p className="text-xs text-violet-400 mt-0.5">{hint}</p>}
        </div>
      </label>
    </div>
  );
}

const HIGHLIGHT_PRESETS = ["", "#ffff00", "#90ee90", "#add8e6", "#ffb6c1", "#ffa500", "#e0b0ff"];
const COLOR_PRESETS = ["", "#000000", "#cc0000", "#006600", "#00008b", "#8b4513", "#555555"];

function SwatchRow({ label, hint, presets, selected, onChange }: {
  label: string;
  hint?: string;
  presets: string[];
  selected: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-0.5">{label}</p>
      {hint && <p className="text-xs text-violet-400 mb-1.5">{hint}</p>}
      <div className="flex gap-1.5 flex-wrap items-center">
        {presets.map((c, i) => (
          <button
            key={i}
            onClick={() => onChange(c)}
            title={c || "None / Default"}
            className="w-7 h-7 rounded-lg transition-all flex items-center justify-center"
            style={{
              backgroundColor: c || "white",
              border: selected === c ? "3px solid #7c3aed" : "1.5px solid #ddd6fe",
              boxShadow: selected === c ? "0 0 0 3px #c4b5fd" : undefined,
            }}
          >
            {!c && <span className="text-violet-300 text-xs leading-none">✕</span>}
          </button>
        ))}
        <input
          type="color"
          value={selected || (label.toLowerCase().includes("highlight") ? "#ffffff" : "#000000")}
          onChange={(e) => onChange(e.target.value)}
          title="Pick a custom color"
          className="w-7 h-7 rounded-lg cursor-pointer p-0"
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
    <div>
      <p className="text-xs text-violet-400 mb-1.5">Text style — click to toggle each on or off</p>
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
    backgroundColor: value.highlight || "white",
    color: value.color || "inherit",
    fontSize: `${value.fontSize}px`,
    border: "1px solid #ede9fe",
  };
  return (
    <StylePickerBox
      label={label}
      preview={<span style={previewStyle} className="rounded-lg px-2 py-0.5 text-xs">Sample</span>}
    >
      <ToggleRow value={value} onChange={patch} />
      <div className="flex gap-3 flex-wrap items-center">
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
            hint="Shrinks and raises the number above the text line"
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

function StylePicker({ label, hint, value, onChange, baseFontSize }: {
  label: string; hint?: string; value: MarkupStyle; onChange: (s: MarkupStyle) => void; baseFontSize: number;
}) {
  function patch(p: Partial<MarkupStyle>) { onChange({ ...value, ...p }); }
  const previewStyle: React.CSSProperties = {
    fontWeight: value.bold ? "bold" : undefined,
    fontStyle: value.italic ? "italic" : undefined,
    textDecoration: value.underline ? "underline" : undefined,
    backgroundColor: value.highlight || "white",
    color: value.color || "inherit",
    fontSize: `${baseFontSize + value.sizeBoost}px`,
    border: "1px solid #ede9fe",
  };
  return (
    <StylePickerBox
      label={label}
      preview={<span style={previewStyle} className="rounded-lg px-2 py-0.5 text-xs">Sample</span>}
    >
      {hint && <p className="text-xs text-violet-400 -mt-1">{hint}</p>}
      <ToggleRow value={value} onChange={patch} />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-violet-500 font-semibold">Extra size</span>
        <input
          type="number" min={0} max={12} step={1} value={value.sizeBoost}
          onChange={(e) => patch({ sizeBoost: Number(e.target.value) })}
          className="bq-input text-xs text-center"
          style={{ width: "56px" }}
        />
        <span className="text-xs text-violet-400">px larger than body text</span>
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

  const phrasesOn = tokenOpts.includeUniquePhrases;

  return (
    <div className="space-y-3 text-sm">

      <Section title="Display" icon="🎨">
        <Labeled label="Font" hint="The typeface used for the scripture text in the preview and exports.">
          <select
            className="bq-select w-full"
            value={displayOpts.fontFamily}
            onChange={(e) => onDisplayChange({ ...displayOpts, fontFamily: e.target.value })}
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f.split(",")[0]}</option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Font size" hint="How big the main scripture text appears. 16px is a comfortable reading size.">
          <div className="flex items-center gap-2">
            <input
              type="range" min={12} max={24} step={1}
              value={displayOpts.fontSize}
              onChange={(e) => onDisplayChange({ ...displayOpts, fontSize: Number(e.target.value) })}
              className="flex-1"
              style={{ accentColor: "#7c3aed" }}
            />
            <span className="bq-badge w-14 text-center">{displayOpts.fontSize}px</span>
          </div>
        </Labeled>
        <Labeled label="Line spacing" hint="The gap between lines of text. More spacing = easier to read and write notes between lines.">
          <div className="flex items-center gap-2">
            <input
              type="range" min={1.2} max={3} step={0.1}
              value={displayOpts.lineSpacing}
              onChange={(e) => onDisplayChange({ ...displayOpts, lineSpacing: Number(e.target.value) })}
              className="flex-1"
              style={{ accentColor: "#7c3aed" }}
            />
            <span className="bq-badge w-14 text-center">{displayOpts.lineSpacing.toFixed(1)}×</span>
          </div>
        </Labeled>
      </Section>

      <Section title="Layout" icon="📐">
        <Labeled label="Verse layout" hint="Choose how verses are displayed — each on its own line (easier to study) or flowing together like a normal paragraph.">
          <div className="segment-control">
            {([["lines", "One verse per line"], ["paragraph", "Paragraph"]] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => onDisplayChange({ ...displayOpts, verseLayout: mode })}
                className={`segment-btn ${displayOpts.verseLayout === mode ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Labeled>
        <Checkbox
          label="Show section headings"
          hint="Displays the topic headings that appear between verse groups (e.g. 'The Birth of Jesus'). These come from the translation, not from you."
          checked={displayOpts.includeSectionHeadings}
          onChange={(v) => onDisplayChange({ ...displayOpts, includeSectionHeadings: v })}
        />
        <Checkbox
          label="Page break before each chapter (export only)"
          hint="When you export to DOCX or HTML, each new chapter will start on a fresh page. Useful for printing multi-chapter passages."
          checked={displayOpts.chapterPageBreak}
          onChange={(v) => onDisplayChange({ ...displayOpts, chapterPageBreak: v })}
        />
      </Section>

      <Section title="Markup" icon="✍️">
        <Checkbox
          label="Mark unique words"
          hint="Highlights words that appear only once in this passage. These are the words quizzers need to memorize most carefully because there's no other context clue."
          checked={tokenOpts.includeUniqueWords}
          onChange={() => toggle("includeUniqueWords")}
        />
        {tokenOpts.includeUniqueWords && (
          <StylePicker
            label="Unique word style"
            hint="How unique words look in the text. The default is bold blue so they stand out clearly."
            value={displayOpts.wordStyle}
            onChange={(s) => onDisplayChange({ ...displayOpts, wordStyle: s })}
            baseFontSize={displayOpts.fontSize}
          />
        )}

        <div className="h-px" style={{ background: "#ede9fe" }} />

        <Checkbox
          label="Mark unique phrases"
          hint="Enables phrase marking. A 'unique phrase' is a group of 2 or 3 words that only appears in that exact combination once in the passage. Turn this on, then choose which phrase lengths to find below."
          checked={tokenOpts.includeUniquePhrases}
          onChange={() => toggle("includeUniquePhrases")}
        />
        <div className="ml-5 space-y-3">
          <Checkbox
            label="Find 2-word phrases"
            hint={phrasesOn ? "Looks for pairs of words (like 'Holy Spirit') that appear together only once." : "Enable phrase marking above to use this."}
            checked={tokenOpts.analyzeTwoWordPhrases}
            onChange={() => toggle("analyzeTwoWordPhrases")}
            disabled={!phrasesOn}
          />
          {phrasesOn && tokenOpts.analyzeTwoWordPhrases && (
            <StylePicker
              label="2-word phrase style"
              hint="How matched 2-word phrases appear. Should look different from unique words and 3-word phrases."
              value={displayOpts.phrase2Style}
              onChange={(s) => onDisplayChange({ ...displayOpts, phrase2Style: s })}
              baseFontSize={displayOpts.fontSize}
            />
          )}
          <Checkbox
            label="Find 3-word phrases"
            hint={phrasesOn ? "Looks for sets of three words that appear together only once." : "Enable phrase marking above to use this."}
            checked={tokenOpts.analyzeThreeWordPhrases}
            onChange={() => toggle("analyzeThreeWordPhrases")}
            disabled={!phrasesOn}
          />
          {phrasesOn && tokenOpts.analyzeThreeWordPhrases && (
            <StylePicker
              label="3-word phrase style"
              hint="How matched 3-word phrases appear. The default is a yellow highlight — different from the other two."
              value={displayOpts.phrase3Style}
              onChange={(s) => onDisplayChange({ ...displayOpts, phrase3Style: s })}
              baseFontSize={displayOpts.fontSize}
            />
          )}
        </div>
      </Section>

      <Section title="Headings &amp; Elements" icon="🏷️" defaultOpen={false}>
        <p className="text-xs text-violet-400 -mt-1">Control how the book title, chapter headings, and verse numbers are styled in the preview and exports.</p>
        <div className="space-y-3">
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
            showSuperscript
          />
        </div>
      </Section>

      {Object.keys(clubStyles).length > 0 && (
        <Section title="Key Verse Indicators" icon="🏆" defaultOpen={true}>
          <p className="text-xs text-violet-400 -mt-1">
            Each club level gets its own shape drawn around the verse number — so quizzers can instantly see which verses their club needs to know.
            Arrange clubs from smallest (most verses required) to largest so the legend makes sense.
          </p>
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
        <p className="text-xs text-violet-400 -mt-1">
          These settings control how the app decides what counts as a single "word" when looking for unique words and phrases. Most people can leave these on.
        </p>
        <Checkbox
          label="Hyphenated words as one word"
          hint="Treats 'well-known' as a single word instead of two. Turn off if you want each part counted separately."
          checked={tokenOpts.hyphenatedWordsAsSingle}
          onChange={() => toggle("hyphenatedWordsAsSingle")}
        />
        <Checkbox
          label="Contractions as one word"
          hint="Treats 'don't' as one word instead of splitting it at the apostrophe."
          checked={tokenOpts.contractionsAsSingle}
          onChange={() => toggle("contractionsAsSingle")}
        />
        <Checkbox
          label="Include possessives ('s)"
          hint="Counts 'God's' and 'God' as the same word. Turn off to treat them as different words."
          checked={tokenOpts.includePossessives}
          onChange={() => toggle("includePossessives")}
        />
      </Section>

    </div>
  );
}
