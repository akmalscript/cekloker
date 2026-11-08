"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/types";

interface PosterAnnotatorProps {
  imageSrc: string;
  imageAlt: string;
  redFlags: RedFlag[];
  activeCode: string | null;
  onSelectFlag: (code: string | null) => void;
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

  return (
    <div className="card overflow-hidden bg-slate-900 border-slate-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300">
        <span className="font-semibold text-white">Poster Lowongan &amp; Bukti Visual</span>
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
          <span className="ml-1 text-[11px] font-mono text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Interactive Poster Area */}
      <div className="relative overflow-auto p-4 flex items-center justify-center min-h-[420px] bg-slate-950/50">
        <div
          className="relative inline-block transition-transform duration-200 origin-center select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Base Image */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[600px] w-auto rounded object-contain shadow-2xl block"
          />

          {/* Bounding Box Overlays */}
          {redFlags.map((flag) => {
            const isActive = activeCode === flag.code;
            const isWaspada = flag.severity === "waspada";
            const regions = flag.regions ?? [];

            return regions.map((region, rIdx) => {
              const bbox = region.bbox;
              const top = `${bbox.y * 100}%`;
              const left = `${bbox.x * 100}%`;
              const width = `${bbox.w * 100}%`;
              const height = `${bbox.h * 100}%`;

              return (
                <div
                  key={`${flag.code}-${rIdx}`}
                  className={cn(
                    "evidence-box cursor-pointer transition-all duration-200",
                    isWaspada && "is-waspada",
                    isActive && "is-active ring-4 ring-offset-1 ring-bahaya scale-[1.02] z-20 shadow-lg"
                  )}
                  style={{
                    top,
                    left,
                    width,
                    height,
                    pointerEvents: "auto",
                  }}
                  onClick={() => onSelectFlag(isActive ? null : flag.code)}
                  title={`${flag.label}: ${flag.reason}`}
                >
                  <span
                    className={cn(
                      "evidence-label shadow-md transition-transform duration-200",
                      isActive && "scale-105"
                    )}
                  >
                    {flag.label}
                  </span>
                </div>
              );
            });
          })}
        </div>
      </div>

      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 text-center no-print">
        Klik kotak penanda di poster untuk melihat rincian bukti di daftar temuan.
      </div>
    </div>
  );
}
