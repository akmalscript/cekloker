"use client";

import { useState } from "react";
import { Image as ImageIcon, Check, RotateCcw, Send, OctagonAlert } from "lucide-react";

export function HeroScanner() {
  const [animating, setAnimating] = useState(true);

  const handleReplay = () => {
    setAnimating(false);
    setTimeout(() => {
      setAnimating(true);
    }, 50);
  };

  return (
    <div
      id="hero-visual"
      className={`${animating ? "scan-run" : ""} flex w-full flex-col items-stretch gap-4 sm:items-center md:flex-row md:items-end md:justify-center lg:justify-end`}
    >
      <figure
        className="card w-full p-3 sm:max-w-[420px] sm:p-4 md:max-w-[360px]"
        aria-labelledby="hero-fig-cap"
      >
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-muted">
            <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">poster-lowongan.jpg</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className="state-stack rounded-full bg-navy-tint px-2.5 py-1 text-[12px] font-bold text-navy"
              aria-hidden="true"
            >
              <span className="state-scanning inline-flex items-center gap-1.5">
                <span className="pulse-dot"></span>Memindai
              </span>
              <span className="state-done inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                Selesai
              </span>
            </span>
            <button
              id="scan-replay"
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-navy-tint hover:text-navy cursor-pointer transition-colors"
              aria-label="Putar ulang animasi pindai"
              onClick={handleReplay}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Poster (HTML/CSS fiktif) */}
        <div className="relative overflow-hidden rounded-lg border border-line bg-[#FFFEFA]">
          <div className="scan-line" aria-hidden="true"></div>
          <div className="flex items-center gap-3 bg-slate-800 px-5 py-4 text-white">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 text-[11px] font-extrabold tracking-wide"
              aria-hidden="true"
            >
              PT
            </span>
            <p className="font-bold leading-snug">PT Contoh Kerja Fiktif</p>
          </div>
          <div className="px-5 pb-5 pt-6">
            <p className="text-[22px] font-extrabold leading-tight text-ink">
              Dibutuhkan Admin Online, Luar Negeri
            </p>
            <ul className="mt-8 space-y-8 text-[15px] font-semibold leading-snug text-slate-800">
              <li>
                <span className="evidence">
                  Gaji Rp15 juta/bulan, tanpa pengalaman
                  <span
                    className="evidence-box is-roomy anim-in"
                    style={{ "--d": "2.05s" } as React.CSSProperties}
                  >
                    <span className="evidence-label">
                      <span className="sr-only">Tanda bahaya: </span>Gaji tidak wajar
                    </span>
                  </span>
                </span>
              </li>
              <li>
                <span className="evidence">
                  Berangkat minggu ini pakai visa turis
                  <span
                    className="evidence-box is-roomy anim-in"
                    style={{ "--d": "2.65s" } as React.CSSProperties}
                  >
                    <span className="evidence-label">
                      <span className="sr-only">Tanda bahaya: </span>Visa turis
                    </span>
                  </span>
                </span>
              </li>
              <li>
                <span className="evidence">
                  Paspor dititipkan ke agen
                  <span
                    className="evidence-box is-roomy anim-in"
                    style={{ "--d": "3.15s" } as React.CSSProperties}
                  >
                    <span className="evidence-label">
                      <span className="sr-only">Tanda bahaya: </span>Penahanan paspor
                    </span>
                  </span>
                </span>
              </li>
            </ul>
            <p className="relative mt-8 flex items-center gap-2 rounded-md bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
              Hubungi via Telegram
              <span
                className="evidence-box anim-in"
                style={{ "--d": "3.7s" } as React.CSSProperties}
              >
                <span className="evidence-label">
                  <span className="sr-only">Tanda bahaya: </span>Pindah ke Telegram
                </span>
              </span>
            </p>
          </div>
        </div>
        <figcaption id="hero-fig-cap" className="sr-only">
          Contoh poster lowongan fiktif yang diperiksa CekLoker. Empat tanda bahaya ditandai: gaji
          tidak wajar, visa turis, penahanan paspor, dan pindah ke Telegram. Hasil: Bahaya.
        </figcaption>
      </figure>

      {/* Kartu hasil terisi bertahap */}
      <div
        className="card w-full shadow-lift sm:max-w-[420px] md:mb-10 md:w-[216px] md:shrink-0"
        aria-hidden="true"
      >
        <div className="p-4">
          <p className="text-[13px] font-semibold text-muted">Hasil pemeriksaan</p>
          <div className="state-stack mt-2 items-center">
            <span className="state-scanning inline-flex items-center gap-2 text-[13px] font-semibold text-muted">
              <span className="pulse-dot"></span>Menganalisis…
            </span>
            <span className="state-done flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="badge badge-bahaya">
                <OctagonAlert className="h-3.5 w-3.5 stroke-[2.5]" />
                Bahaya
              </span>
              <span className="text-[12px] font-semibold text-muted">4 red flag</span>
            </span>
          </div>
          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm font-semibold text-ink">
            <li
              className="anim-in flex items-center gap-2"
              style={{ "--d": "2.2s" } as React.CSSProperties}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-bahaya"></span>Gaji
              tidak wajar
            </li>
            <li
              className="anim-in flex items-center gap-2"
              style={{ "--d": "2.8s" } as React.CSSProperties}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-bahaya"></span>Visa
              turis
            </li>
            <li
              className="anim-in flex items-center gap-2"
              style={{ "--d": "3.3s" } as React.CSSProperties}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-bahaya"></span>
              Penahanan paspor
            </li>
            <li
              className="anim-in flex items-center gap-2"
              style={{ "--d": "3.85s" } as React.CSSProperties}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-bahaya"></span>Pindah
              ke Telegram
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

