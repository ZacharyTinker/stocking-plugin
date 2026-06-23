"use client";

import { ClubStyle, ElementStyle, CLUB_COLOR_PALETTE } from "@/types/scripture";

interface Props {
  club: string;
  style: ClubStyle;
  count: number;
  onChange: (s: ClubStyle) => void;
}

const INDICATORS: { value: ClubStyle["indicator"]; label: string; preview: string }[] = [
  { value: "filled",         label: "Solid circle",  preview: "●" },
  { value: "outline",        label: "Ring circle",   preview: "○" },
  { value: "filled-square",  label: "Solid square",  preview: "■" },
  { value: "outline-square", label: "Open square",   preview: "□" },
  { value: "none",           label: "None",          preview: "–" },
];

const COLOR_PRESETS = ["", ...CLUB_COLOR_PALETTE, "#888888", "#000000"];

export function indicatorChar(style: ClubStyle): string {
  switch (style.indicator) {
    case "filled": return "●";
    case "outline": return "○";
    case "filled-square": return "■";
    case "outline-square": return "□";
    default: return "";
  }
}

export default function ClubStylePicker({ club, style, count, onChange }: Props) {
  function patch(p: Partial<ClubStyle>) { onChange({ ...style, ...p }); }

  return (
    <div className="rounded-xl p-3 space-y-2.5" style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe" }}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-violet-800 text-xs uppercase tracking-wide">{club}</span>
          <span className="ml-2 text-xs text-violet-400">{count} verses</span>
        </div>
        <span className="text-sm font-mono">
          {style.indicator !== "none"
            ? <IndicatorDemo verseNum={5} clubStyle={style} />
            : <sup className="text-violet-300 text-xs">5</sup>}
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {INDICATORS.map((ind) => (
          <button
            key={ind.value}
            onClick={() => patch({ indicator: ind.value })}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
            style={style.indicator === ind.value ? {
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white",
              boxShadow: "0 2px 8px rgba(124,58,237,0.25)"
            } : {
              background: "white", color: "#6d28d9", border: "1.5px solid #ddd6fe"
            }}
          >
            <span style={style.indicator === ind.value ? { color: "white" } : { color: style.color }}>{ind.preview}</span>
            <span>{ind.label}</span>
          </button>
        ))}
      </div>

      {style.indicator !== "none" && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Color</p>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PRESETS.map((c, i) => (
              <button
                key={i}
                onClick={() => patch({ color: c || "#888888" })}
                title={c || "Default"}
                className="w-8 h-8 rounded-lg transition-all flex items-center justify-center relative"
                style={{
                  backgroundColor: c || "#cccccc",
                  border: style.color === c ? "3px solid #7c3aed" : "1.5px solid #ddd6fe",
                  boxShadow: style.color === c ? "0 0 0 3px #c4b5fd" : undefined,
                }}
              />
            ))}
            <input
              type="color"
              value={style.color || "#888888"}
              onChange={(e) => patch({ color: e.target.value })}
              title="Custom color"
              className="w-8 h-8 rounded-lg cursor-pointer p-0"
              style={{ border: "1.5px solid #ddd6fe" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders the circle indicator around a sample verse number, matching preview/export output */
export function IndicatorDemo({
  verseNum,
  clubStyle,
  verseNumberStyle,
}: {
  verseNum: number | string;
  clubStyle: ClubStyle;
  verseNumberStyle?: ElementStyle;
}) {
  if (clubStyle.indicator === "none") return null;

  const vnSize = verseNumberStyle?.fontSize ?? 10;
  const vnColor = verseNumberStyle?.color || "#888888";
  const isSuperscript = verseNumberStyle ? verseNumberStyle.superscript !== false : true;
  const valign: React.CSSProperties["verticalAlign"] = isSuperscript ? "super" : "baseline";

  const boxSize = Math.round(vnSize * 1.6);
  const isSquare = clubStyle.indicator === "filled-square" || clubStyle.indicator === "outline-square";
  const isFilled = clubStyle.indicator === "filled" || clubStyle.indicator === "filled-square";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: `${boxSize}px`,
        height: `${boxSize}px`,
        borderRadius: isSquare ? "2px" : "50%",
        background: isFilled ? clubStyle.color : "transparent",
        border: !isFilled ? `1.5px solid ${clubStyle.color}` : "none",
        fontSize: `${vnSize}px`,
        verticalAlign: valign,
        lineHeight: 1,
        color: isFilled ? "white" : vnColor,
        fontWeight: "normal",
        fontStyle: "normal",
      }}
    >
      {verseNum}
    </span>
  );
}
