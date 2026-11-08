"use client";

import { useState, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/types";

export type LabelPosition = "top" | "bottom" | "right" | "left";
export type PlacementMode = "auto" | "side" | "top" | "bottom";

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

function getPositionLabel(pos: LabelPosition): string {
  switch (pos) {
    case "top":
      return "Di Atas";
    case "bottom":
      return "Di Bawah";
    case "right":
      return "Samping Kanan";
    case "left":
      return "Samping Kiri";
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
  const [globalMode, setGlobalMode] = useState<PlacementMode>("auto");
  const [customPositions, setCustomPositions] = useState<Record<string, LabelPosition>>({});

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

  // Determine effective position for a specific region
  const getEffectivePosition = (id: string): LabelPosition => {
    if (customPositions[id]) return customPositions[id];
    if (globalMode === "side") return "right";
    if (globalMode === "top") return "top";
    if (globalMode === "bottom") return "bottom";
    return smartPositions[id] || "right";
  };

  // Cycle position manually for an individual label
  const handleCyclePosition = (id: string) => {
    const current = getEffectivePosition(id);
    const cycleOrder: LabelPosition[] = ["right", "bottom", "left", "top"];
    const nextIdx = (cycleOrder.indexOf(current) + 1) % cycleOrder.length;
    setCustomPositions((prev) => ({
      ...prev,
      [id]: cycleOrder[nextIdx],
    }));
  };

  return (
    <div className="card overflow-hidden bg-slate-900 border-slate-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 sm:px-4 py-2.5 text-xs text-slate-300 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Poster Lowongan &amp; Bukti Visual</span>
          {allItems.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono hidden sm:inline">
              {allItems.length} temuan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 no-print ml-auto">
          {/* Label Placement Mode Selector */}
          {allItems.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px]">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400 hidden md:inline">Posisi Label:</span>
              <select
                value={globalMode}
                onChange={(e) => {
                  setGlobalMode(e.target.value as PlacementMode);
                  setCustomPositions({});
                }}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-[11px]"
                aria-label="Pengaturan posisi label anotasi"
              >
                <option value="auto" className="bg-slate-900 text-white">Pintar (Otomatis)</option>
                <option value="side" className="bg-slate-900 text-white">Samping</option>
                <option value="top" className="bg-slate-900 text-white">Di Atas</option>
                <option value="bottom" className="bg-slate-900 text-white">Di Bawah</option>
              </select>
            </div>
          )}

          {/* Reset custom positions if any */}
          {Object.keys(customPositions).length > 0 && (
            <button
              type="button"
              className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              onClick={() => setCustomPositions({})}
              title="Kembalikan posisi semua label ke otomatis"
            >
              Reset Posisi
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
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
            const isWaspada = flag.severity === "waspada";
            const effectivePos = getEffectivePosition(item.id);

            const bbox = item.bbox;
            const top = `${bbox.y * 100}%`;
            const left = `${bbox.x * 100}%`;
            const width = `${bbox.w * 100}%`;
            const height = `${bbox.h * 100}%`;

            return (
              <div
                key={item.id}
                className={cn(
                  "evidence-box cursor-pointer transition-all duration-200",
                  isWaspada && "is-waspada",
                  isActive && "is-active ring-4 ring-offset-1 ring-bahaya scale-[1.01] z-30 shadow-xl"
                )}
                style={{
                  top,
                  left,
                  width,
                  height,
                  right: "auto",
                  bottom: "auto",
                  pointerEvents: "auto",
                }}
                onClick={() => onSelectFlag(isActive ? null : flag.code)}
                title={`${flag.label}: ${flag.reason}`}
              >
                <span
                  className={cn(
                    "evidence-label shadow-lg transition-all duration-200 inline-flex items-center gap-1 cursor-pointer select-none",
                    isWaspada ? "!bg-[#B45309]" : "!bg-bahaya",
                    isActive
                      ? "ring-2 ring-white scale-105 z-30 font-bold"
                      : "hover:scale-105 z-10 hover:z-20"
                  )}
                  style={{
                    ...getLabelPositionStyles(effectivePos),
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

                  {/* Manual Position Cycle Button */}
                  <button
                    type="button"
                    className="ml-1 -mr-0.5 p-0.5 rounded hover:bg-black/30 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title={`Posisi label: ${getPositionLabel(effectivePos)}. Klik untuk ubah posisi (Kanan/Bawah/Kiri/Atas)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCyclePosition(item.id);
                    }}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 no-print">
        <span>Klik kotak penanda di poster untuk melihat rincian bukti di daftar temuan.</span>
        <span className="text-slate-500 hidden sm:inline">
          Posisi label otomatis disesuaikan agar tidak menutupi teks. Gunakan ikon ↻ untuk memindahkan posisi label.
        </span>
      </div>
    </div>
  );
}
