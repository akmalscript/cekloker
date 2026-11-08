"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/types";

interface TextEvidencePanelProps {
  text: string;
  redFlags: RedFlag[];
  activeCode: string | null;
  onSelectFlag: (code: string | null) => void;
}

interface Segment {
  text: string;
  flagCode?: string;
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Pecah teks menjadi segmen biasa dan segmen yang berisi kutipan red flag.
 * Pencocokan tidak peka huruf besar/kecil dan mengabaikan perbedaan spasi.
 */
function buildSegments(text: string, redFlags: RedFlag[]): Segment[] {
  const ranges: { start: number; end: number; code: string }[] = [];

  for (const flag of redFlags) {
    const quote = flag.quote?.trim();
    if (!quote) continue;

    // Regex longgar: setiap spasi pada kutipan cocok dengan spasi/baris baru apa pun.
    const pattern = quote
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");

    let match: RegExpExecArray | null = null;
    try {
      match = new RegExp(pattern, "i").exec(text);
    } catch {
      match = null;
    }
    if (!match) continue;

    const start = match.index;
    const end = start + match[0].length;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, code: flag.code });
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start) });
    segments.push({ text: text.slice(r.start, r.end), flagCode: r.code });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export function TextEvidencePanel({
  text,
  redFlags,
  activeCode,
  onSelectFlag,
}: TextEvidencePanelProps) {
  const segments = useMemo(() => buildSegments(text, redFlags), [text, redFlags]);
  const hasText = normalize(text).length > 0;

  return (
    <div className="card overflow-hidden bg-white border-line">
      <div className="flex items-center justify-between border-b border-line bg-slate-50 px-4 py-2.5 text-xs">
        <span className="font-semibold text-ink">Teks Percakapan &amp; Bukti</span>
      </div>

      <div className="max-h-[680px] overflow-auto p-4 text-sm leading-relaxed text-ink whitespace-pre-wrap break-words">
        {hasText ? (
          segments.map((seg, i) => {
            if (!seg.flagCode) return <Fragment key={i}>{seg.text}</Fragment>;
            const code = seg.flagCode;
            const isActive = activeCode === code;
            return (
              <mark
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFlag(isActive ? null : code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectFlag(isActive ? null : code);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded-sm px-0.5 text-ink transition-colors",
                  isActive
                    ? "bg-red-200 ring-2 ring-red-400"
                    : "bg-red-100 hover:bg-red-200",
                )}
              >
                {seg.text}
              </mark>
            );
          })
        ) : (
          <p className="text-muted">Teks tidak tersedia untuk pemeriksaan ini.</p>
        )}
      </div>

      <div className="border-t border-line bg-slate-50 px-4 py-2 text-[11px] text-muted text-center no-print">
        Klik bagian yang disorot untuk melihat rincian bukti di daftar temuan.
      </div>
    </div>
  );
}
