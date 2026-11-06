"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import type { RedFlag } from "@/types";

interface FeedbackModalProps {
  flag: RedFlag | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ flag, isOpen, onClose }: FeedbackModalProps) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !flag) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    // Simulate saving feedback
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div className="card w-full max-w-lg bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          className="absolute right-4 top-4 rounded p-1 text-muted hover:text-ink cursor-pointer"
          onClick={onClose}
          aria-label="Tutup modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="mx-auto h-12 w-12 text-aman" />
            <h3 className="text-lg font-bold text-ink">Sanggahan Diterima</h3>
            <p className="text-sm text-muted">
              Terima kasih. Masukan Anda membantu melatih dan menyempurnakan ketelitian model AI kami.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="eyebrow">Koreksi Temuan AI</span>
              <h3 id="feedback-title" className="text-xl font-bold text-ink mt-1">
                Sanggahan untuk &quot;{flag.label}&quot;
              </h3>
              <p className="text-xs text-muted mt-1">
                Jika Anda merasa indikasi ini tidak tepat pada konteks lowongan asli, beri tahu kami alasannya.
              </p>
            </div>

            <div className="rounded bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
              <span className="font-semibold block text-slate-900">Temuan AI:</span>
              <p className="mt-0.5">{flag.reason}</p>
            </div>

            <div>
              <label htmlFor="sanggahan-teks" className="field-label text-sm">
                Alasan koreksi Anda:
              </label>
              <textarea
                id="sanggahan-teks"
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan mengapa menurut Anda temuan ini keliru atau merupakan konteks legal yang sah..."
                className="input mt-2 resize-none !h-28 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!reason.trim()}
                className="btn btn-primary btn-sm cursor-pointer disabled:opacity-50"
              >
                Kirim Sanggahan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
