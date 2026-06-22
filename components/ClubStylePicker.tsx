"use client";

import { ClubStyle, ElementStyle, CLUB_COLOR_PALETTE } from "@/types/scripture";

interface Props {
  club: string;
  style: ClubStyle;
  count: number;
  onChange: (s: ClubStyle) => void;
}

const INDICATORS: { value: ClubStyle["indicator"]; label: string; preview: string }[] = [
  { value: "filled",  label: "Filled circle",  preview: "●" },
  { value: "outline", label: "Ring",            preview: "○" },
  { value: "dot",     label: "Dot",             preview: "•" },
  { value: "none",    label: "None",            preview: "–" },
];

const COLOR_PRESETS = ["", ...CLUB_COLOR_PALETTE, "#888888", "#000000"];

export function indicatorChar(style: ClubStyle): string {
  return style.indicator === "filled" ? "●" : style.indicator === "outline" ? "○" : style.indicator === "dot" ? "•" : "";
}

export default function ClubStylePicker({ club, style, count, onChange }: Props) {
  function patch(p: Partial<ClubStyle>) { onChange({ ...style, ...p }); }

  return (
    <div className="mt-2 mb-2 border rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">{club}</span>
          <span className="ml-2 text-xs text-gray-400">{count} verses</span>
        </div>
        {/* Live preview of what the verse number looks like */}
        <span className="text-sm font-mono">
          {style.indicator !== "none" && (
            <IndicatorDemo verseNum={5} clubStyle={style} />
          )}
          {style.indicator === "none" && (
            <sup className="text-gray-400 text-xs">5</sup>
          )}
        </span>
      </div>

      {/* Indicator type */}
      <div className="flex gap-2 flex-wrap">
        {INDICATORS.map((ind) => (
          <button
            key={ind.value}
            onClick={() => patch({ indicator: ind.value })}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-sm transition-colors ${
              style.indicator === ind.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <span style={{ color: style.color }}>{ind.preview}</span>
            <span className="text-xs">{ind.label}</span>
          </button>
        ))}
      </div>

      {/* Color */}
      {style.indicator !== "none" && (
        <div className="space-y-1">
          <span className="text-xs text-gray-500">Color</span>
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map((c, i) => (
              <button
                key={i}
                onClick={() => patch({ color: c || "#888888" })}
                title={c || "Default"}
                className={`w-6 h-6 rounded border-2 ${style.color === c || (!c && !style.color) ? "border-blue-500" : "border-gray-300"}`}
                style={{ backgroundColor: c || "#cccccc" }}
              />
            ))}
            <input
              type="color"
              value={style.color || "#888888"}
              onChange={(e) => patch({ color: e.target.value })}
              title="Custom color"
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
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
  verseNum: number;
  clubStyle: ClubStyle;
  verseNumberStyle?: ElementStyle;
}) {
  if (clubStyle.indicator === "none") return null;

  const vnSize = verseNumberStyle?.fontSize ?? 10;
  const vnColor = verseNumberStyle?.color || "#888888";
  const isSuperscript = verseNumberStyle ? verseNumberStyle.superscript !== false : true;
  const valign: React.CSSProperties["verticalAlign"] = isSuperscript ? "super" : "baseline";

  if (clubStyle.indicator === "dot") {
    return (
      <span>
        <span style={{ color: clubStyle.color, fontSize: `${vnSize}px`, marginRight: "0.1em", verticalAlign: valign }}>•</span>
        <span style={{ color: vnColor, fontSize: `${vnSize}px`, verticalAlign: valign }}>{verseNum}</span>
      </span>
    );
  }

  const isFilled = clubStyle.indicator === "filled";
  const circleSize = Math.round(vnSize * 1.6);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: `${circleSize}px`,
        height: `${circleSize}px`,
        borderRadius: "50%",
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
