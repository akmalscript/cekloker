"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  MessageSquare,
  OctagonAlert,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/Badge";
import type { RedFlag } from "@/types";

interface RedFlagListProps {
  redFlags: RedFlag[];
  activeCode: string | null;
  onSelectFlag: (code: string | null) => void;
  onOpenFeedback: (flag: RedFlag) => void;
}

export function RedFlagList({
  redFlags,
  activeCode,
  onSelectFlag,
  onOpenFeedback,
}: RedFlagListProps) {
  // State collapsible per code (compact by default)
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  // Gulir halus kartu ke viewport & otomatis buka saat anotasi di poster dipilih
  useEffect(() => {
    if (activeCode) {
      setExpandedCodes((prev) => ({ ...prev, [activeCode]: true }));
      const el = document.getElementById(`flag-card-${activeCode}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeCode]);

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const willBeOpen = !prev[code];
      if (willBeOpen) {
        onSelectFlag(code);
      } else if (activeCode === code) {
        onSelectFlag(null);
      }
      return { ...prev, [code]: willBeOpen };
    });
  };

  if (redFlags.length === 0) {
    return (
      <div className="card p-8 text-center bg-white rounded-2xl">
        <CheckCircle2 className="mx-auto h-12 w-12 text-aman stroke-[2]" />
        <h3 className="mt-4 text-lg font-bold text-ink">Tidak Ditemukan Indikasi Bahaya</h3>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          Analisis AI tidak menemukan pola red flag umum penipuan atau perdagangan orang pada teks maupun poster ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-bahaya-ink" />
          <span>Rincian Indikasi Bahaya ({redFlags.length})</span>
        </h3>
        <span className="text-xs text-muted">
          Ketuk kartu untuk melihat detail bukti
        </span>
      </div>

      <div className="space-y-3">
        {redFlags.map((flag) => {
          const isActive = activeCode === flag.code;
          const isOpen = !!expandedCodes[flag.code];
          const isWaspada = flag.severity === "waspada";
          const isAman = flag.severity === "aman";

          const IconComponent = isWaspada
            ? TriangleAlert
            : isAman
            ? CheckCircle2
            : OctagonAlert;

          const circleStyle = isWaspada
            ? "bg-amber-100/90 text-amber-800"
            : isAman
            ? "bg-emerald-100 text-emerald-800"
            : "bg-red-100 text-red-800";

          return (
            <div
              key={flag.code}
              id={`flag-card-${flag.code}`}
              className={cn(
                "card p-4 sm:p-5 transition-all duration-300 border bg-white rounded-2xl relative",
                isActive
                  ? "border-navy ring-4 ring-navy/25 ring-offset-1 bg-navy-tint/20 shadow-lg scale-[1.01] -translate-y-0.5 z-10"
                  : "border-line hover:border-slate-300 hover:shadow-sm"
              )}
            >
              {/* Header Baris Collapsible */}
              <div
                className="flex items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => toggleExpand(flag.code)}
              >
                {/* Kiri: Avatar Ikon Bulat + Judul Indikasi */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shrink-0",
                      circleStyle
                    )}
                  >
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg text-ink truncate leading-tight">
                    {flag.label}
                  </h4>
                </div>

                {/* Kanan: Badge Tingkat Risiko & Chevron Toggle */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <RiskBadge status={flag.severity} />
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-slate-500 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>

              {/* Konten Detail saat Terbuka (Collapsible Expanded) */}
              {isOpen && (
                <div className="mt-4 pt-1 space-y-3.5">
                  {/* Deskripsi Alasan */}
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                    {flag.reason}
                  </p>

                  {/* Kutipan Bukti */}
                  {flag.quote && (
                    <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-800 border border-slate-200/80 flex items-start gap-2.5">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                      <p className="italic font-medium text-slate-800">
                        &ldquo;{flag.quote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Badge Bukti Visual */}
                  {(flag.regions?.length ?? 0) > 0 && (
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-100/70 border border-blue-200/60 px-3 py-1 rounded-full">
                        <Eye className="h-3.5 w-3.5 text-blue-800" />
                        <span>{flag.regions?.length} bukti visual</span>
                      </span>
                    </div>
                  )}

                  {/* Dasar Hukum (bila ada) */}
                  {flag.legal_basis && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-0.5">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-navy" />
                      <span>Dasar Rujukan: {flag.legal_basis}</span>
                    </div>
                  )}

                  {/* Bottom Bar: Koreksi / Sanggahan */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between no-print">
                    <span className="text-xs sm:text-sm text-slate-500 font-normal">
                      Merasa tanda ini keliru?
                    </span>
                    <button
                      type="button"
                      className="text-xs sm:text-sm font-bold text-navy hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFeedback(flag);
                      }}
                    >
                      Beri sanggahan / koreksi
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
