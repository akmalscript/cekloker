"use client";

import { AlertTriangle, BookOpen, MessageSquareQuote, CheckCircle2, ShieldAlert } from "lucide-react";
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
  if (redFlags.length === 0) {
    return (
      <div className="card p-8 text-center bg-white">
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
          Pilih kartu untuk menyorot bukti visual
        </span>
      </div>

      <div className="space-y-3">
        {redFlags.map((flag) => {
          const isActive = activeCode === flag.code;

          return (
            <div
              key={flag.code}
              id={`flag-card-${flag.code}`}
              className={cn(
                "card p-4 transition-all duration-200 cursor-pointer border",
                isActive
                  ? "border-bahaya bg-bahaya-tint/30 shadow-md ring-2 ring-bahaya/40"
                  : "border-line bg-white hover:border-slate-400"
              )}
              onClick={() => onSelectFlag(isActive ? null : flag.code)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RiskBadge status={flag.severity} />
                  <h4 className="font-bold text-base text-ink">{flag.label}</h4>
                </div>
                {(flag.regions?.length ?? 0) > 0 && (
                  <span className="text-[11px] font-semibold text-navy bg-navy-tint px-2 py-0.5 rounded-full shrink-0">
                    {flag.regions?.length} Bukti Visual
                  </span>
                )}
              </div>

              {/* Alasan */}
              <p className="mt-2.5 text-sm text-slate-700 leading-relaxed font-normal">
                {flag.reason}
              </p>

              {/* Kutipan Bukti */}
              {flag.quote && (
                <div className="mt-3 flex items-start gap-2 rounded bg-slate-50 p-2.5 text-xs text-slate-800 border border-slate-200">
                  <MessageSquareQuote className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                  <p className="italic font-medium">&quot;{flag.quote}&quot;</p>
                </div>
              )}

              {/* Dasar Hukum */}
              {flag.legal_basis && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-navy" />
                  <span>Dasar Rujukan: {flag.legal_basis}</span>
                </div>
              )}

              {/* Tombol Koreksi Hasil AI (FR-LPR-03) */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between no-print">
                <span className="text-[11px] text-muted">
                  Merasa tanda ini keliru?
                </span>
                <button
                  type="button"
                  className="text-xs text-navy font-semibold hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFeedback(flag);
                  }}
                >
                  Beri Sanggahan / Koreksi
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
