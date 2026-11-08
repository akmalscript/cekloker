"use client";

import { useState, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/types";

export type LabelPosition = "top" | "bottom" | "right" | "left";

interface FlatRegionItem {
  id: string;
  flagCode: string;
  flag: RedFlag;
  rIdx: number;
  bbox: { x: number; y: number; w: number; h: number };
}

interface PosterAnnotatorProps {
  imageSrc: string;
  imageAlt: string;
  redFlags: RedFlag[];
  activeCode: string | null;
  onSelectFlag: (code: string | null) => void;
}

/**
 * Intelligent collision-avoidance positioning algorithm for evidence labels.
 * Determines whether a label should float top, bottom, right, or left of its
 * bounding box so it never obscures its own annotated text or neighboring boxes.
 */
function computeSmartPositions(items: FlatRegionItem[]): Record<string, LabelPosition> {
  const result: Record<string, LabelPosition> = {};
  if (items.length === 0) return result;

  // Process items sorted top-to-bottom by vertical position
  const sorted = [...items].sort((a, b) => a.bbox.y - b.bbox.y);

  sorted.forEach((item, index) => {
    const { x, y, w, h } = item.bbox;
    const rightEdge = x + w;
    const bottomEdge = y + h;

    // Check boundaries within poster
    const canTop = y >= 0.055;
    const canBottom = bottomEdge <= 0.94;
    const canRight = rightEdge <= 0.72; // at least 28% width free on right
    const canLeft = x >= 0.28;          // at least 28% width free on left

    // Check relationships with other regions
    let hasRegionDirectlyAbove = false;
    let hasRegionDirectlyBelow = false;
    let hasRegionOnRight = false;
    let hasRegionOnLeft = false;

    for (let j = 0; j < items.length; j++) {
      if (items[j].id === item.id) continue;
      const other = items[j].bbox;
      const otherRight = other.x + other.w;
      const otherBottom = other.y + other.h;

      // Vertical distance and horizontal overlap for above/below checks
      const horizontalOverlap =
        Math.max(x, other.x) < Math.min(rightEdge, otherRight) + 0.03;

      // Is other directly above? (gap < 0.065)
      if (otherBottom <= y && y - otherBottom < 0.065 && horizontalOverlap) {
        hasRegionDirectlyAbove = true;
      }

      // Is other directly below? (gap < 0.065)
      if (other.y >= bottomEdge && other.y - bottomEdge < 0.065 && horizontalOverlap) {
        hasRegionDirectlyBelow = true;
      }

      // Is other directly to the right?
      const verticalOverlap =
        Math.max(y, other.y) < Math.min(bottomEdge, otherBottom) + 0.03;
      if (other.x >= rightEdge && other.x - rightEdge < 0.25 && verticalOverlap) {
        hasRegionOnRight = true;
      }

      // Is other directly to the left?
      if (otherRight <= x && x - otherRight < 0.25 && verticalOverlap) {
        hasRegionOnLeft = true;
      }
    }

    // Check if right side is already occupied by a neighboring label
    let rightIsCrowded = false;
    for (let k = 0; k < index; k++) {
      const prevId = sorted[k].id;
      if (result[prevId] === "right") {
        const prevY = sorted[k].bbox.y;
        if (Math.abs(y - prevY) < 0.07) {
          rightIsCrowded = true;
          break;
        }
      }
    }

    // --- Decision Priority ---

    // Case 1: Very close to top edge (e.g. avatar / account header)
    if (!canTop) {
      if (canRight && !hasRegionOnRight && !rightIsCrowded) {
        result[item.id] = "right";
        return;
      }
      if (canBottom && !hasRegionDirectlyBelow) {
        result[item.id] = "bottom";
        return;
      }
      result[item.id] = canRight ? "right" : "bottom";
      return;
    }

    // Case 2: Region directly below (stacked lines, e.g. upper line)
    if (hasRegionDirectlyBelow && !hasRegionDirectlyAbove) {
      if (canRight && !hasRegionOnRight && !rightIsCrowded) {
        result[item.id] = "right";
        return;
      }
      if (canTop) {
        result[item.id] = "top";
        return;
      }
    }

    // Case 3: Region directly above (stacked lines, e.g. lower line)
    if (hasRegionDirectlyAbove && !hasRegionDirectlyBelow) {
      if (canBottom) {
        result[item.id] = "bottom";
        return;
      }
      if (canRight && !hasRegionOnRight && !rightIsCrowded) {
        result[item.id] = "right";
        return;
      }
    }

    // Case 4: Sandwiched region (regions both above AND below)
    if (hasRegionDirectlyAbove && hasRegionDirectlyBelow) {
      if (canRight && !hasRegionOnRight && !rightIsCrowded) {
        result[item.id] = "right";
        return;
      }
      if (canLeft && !hasRegionOnLeft) {
        result[item.id] = "left";
        return;
      }
      result[item.id] = canRight ? "right" : "bottom";
      return;
    }

    // Case 5: Single line with spacious right margin
    if (canRight && !hasRegionOnRight && !rightIsCrowded && rightEdge <= 0.65) {
      result[item.id] = "right";
      return;
    }

    // Default fallback
    if (canTop && !hasRegionDirectlyAbove) {
      result[item.id] = "top";
    } else if (canBottom && !hasRegionDirectlyBelow) {
      result[item.id] = "bottom";
    } else if (canRight && !hasRegionOnRight) {
      result[item.id] = "right";
    } else {
      result[item.id] = canTop ? "top" : "bottom";
    }
  });

  return result;
}

/**
 * Returns inline CSS positioning so the label floats completely outside
 * the bounding box without overlapping the highlighted text inside.
 */
function getLabelPositionStyles(position: LabelPosition): React.CSSProperties {
  switch (position) {
    case "top":
      return {
        bottom: "calc(100% + 5px)",
        top: "auto",
        left: "0px",
        right: "auto",
        transform: "none",
      };
    case "bottom":
      return {
        top: "calc(100% + 5px)",
        bottom: "auto",
        left: "0px",
        right: "auto",
        transform: "none",
      };
    case "right":
      return {
        left: "calc(100% + 6px)",
        right: "auto",
        top: "50%",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
    case "left":
      return {
        right: "calc(100% + 6px)",
        left: "auto",
        top: "50%",
        bottom: "auto",
        transform: "translateY(-50%)",
      };
  }
}

export function PosterAnnotator({
  imageSrc,
  imageAlt,
  redFlags,
  activeCode,
  onSelectFlag,
}: PosterAnnotatorProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));
  const handleResetZoom = () => setZoom(1);

  // Flatten all regions across redFlags
  const allItems = useMemo<FlatRegionItem[]>(() => {
    const items: FlatRegionItem[] = [];
    redFlags.forEach((flag) => {
      (flag.regions ?? []).forEach((region, rIdx) => {
        items.push({
          id: `${flag.code}-${rIdx}`,
          flagCode: flag.code,
          flag,
          rIdx,
          bbox: region.bbox,
        });
      });
    });
    return items;
  }, [redFlags]);

  // Compute smart positions automatically
  const smartPositions = useMemo(() => {
    return computeSmartPositions(allItems);
  }, [allItems]);

  return (
    <div className="card overflow-hidden bg-slate-900 border-slate-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300">
        <span className="font-semibold text-white">Gambar Lowongan &amp; Bukti Visual</span>

        <div className="flex items-center gap-1.5 no-print">
          <button
            type="button"
            className="rounded p-1.5 hover:bg-slate-800 transition-colors cursor-pointer text-slate-300 hover:text-white"
            aria-label="Perbesar poster"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-slate-800 transition-colors cursor-pointer text-slate-300 hover:text-white"
            aria-label="Perkecil poster"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-slate-800 transition-colors cursor-pointer text-slate-300 hover:text-white"
            aria-label="Atur ulang ukuran"
            onClick={handleResetZoom}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <span className="ml-1 text-[11px] font-mono text-slate-400 hidden sm:inline">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Interactive Poster Area */}
      <div className="relative overflow-auto p-4 flex items-center justify-center min-h-[480px] bg-slate-950/50">
        <div
          className="relative inline-block transition-transform duration-200 origin-center select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Base Image */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[680px] w-auto rounded object-contain shadow-2xl block"
          />

          {/* Bounding Box Overlays */}
          {allItems.map((item) => {
            const flag = item.flag;
            const isActive = activeCode === flag.code;
            const effectivePos = smartPositions[item.id] || "right";

            const bbox = item.bbox;
            // Add a comfortable breathing room (clearance) around the detected text
            // so the 2px border frames the text cleanly without slicing into ascenders/descenders
            const top = `max(0px, calc(${bbox.y * 100}% - 6px))`;
            const left = `max(0px, calc(${bbox.x * 100}% - 5px))`;
            const width = `calc(${bbox.w * 100}% + 14px)`;
            const height = `calc(${bbox.h * 100}% + 11px)`;

            return (
              <div
                key={item.id}
                className={cn(
                  "evidence-box cursor-pointer transition-all duration-200 !rounded-none !border-[#dc2626]",
                  isActive ? "is-active z-30 !bg-red-500/5" : "!bg-transparent hover:!bg-red-500/[0.02]"
                )}
                style={{
                  top,
                  left,
                  width,
                  height,
                  borderRadius: 0,
                  borderColor: "#dc2626",
                  backgroundColor: isActive ? "rgba(220, 38, 38, 0.05)" : "transparent",
                  boxShadow: isActive ? "0 0 0 3.5px rgba(220, 38, 38, 0.28)" : "none",
                  right: "auto",
                  bottom: "auto",
                  pointerEvents: "auto",
                }}
                onClick={() => onSelectFlag(isActive ? null : flag.code)}
                title={`${flag.label}: ${flag.reason}`}
              >
                <span
                  className={cn(
                    "evidence-label shadow-md transition-all duration-200 inline-flex items-center gap-1 cursor-pointer select-none !rounded-none !bg-[#dc2626] text-white",
                    isActive ? "z-30 font-bold" : "z-10 hover:z-20"
                  )}
                  style={{
                    ...getLabelPositionStyles(effectivePos),
                    borderRadius: 0,
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlag(isActive ? null : flag.code);
                  }}
                >
                  {/* Visual directional arrow pointing to the bounding box */}
                  {effectivePos === "right" && (
                    <span className="text-[9px] -ml-0.5 leading-none select-none opacity-90">◀</span>
                  )}
                  {effectivePos === "bottom" && (
                    <span className="text-[9px] -mt-0.5 leading-none select-none opacity-90">▲</span>
                  )}

                  <span className="truncate max-w-[220px]">{flag.label}</span>

                  {effectivePos === "top" && (
                    <span className="text-[9px] -mb-0.5 leading-none select-none opacity-90">▼</span>
                  )}
                  {effectivePos === "left" && (
                    <span className="text-[9px] -mr-0.5 leading-none select-none opacity-90">▶</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 text-center no-print">
        Klik kotak penanda untuk melihat rincian bukti di daftar temuan.
      </div>
    </div>
  );
}
