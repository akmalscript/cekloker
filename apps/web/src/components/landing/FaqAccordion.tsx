"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Apakah hasil CekLoker pasti benar?",
    answer:
      "Tidak. CekLoker memberi indikasi risiko beserta buktinya. Keputusan tetap di tanganmu, dan untuk lowongan luar negeri selalu cek ke jalur resmi.",
  },
  {
    id: "faq-2",
    question: "Apakah data saya aman?",
    answer:
      "Data sensitif seperti NIK, nomor rekening, dan alamat disamarkan (blur) otomatis di sisi server sebelum diproses oleh model kecerdasan buatan.",
  },
  {
    id: "faq-3",
    question: "Apakah harus punya akun?",
    answer:
      "Tidak. Pengguna tamu dapat melakukan pemeriksaan hingga 3 kali per hari. Daftarkan akun untuk menyimpan riwayat pemeriksaan secara permanen.",
  },
  {
    id: "faq-4",
    question: "Apa saja yang bisa dicek?",
    answer:
      "Poster, tangkapan layar (screenshot), atau teks lowongan dalam dan luar negeri, serta tangkapan layar percakapan chat dengan perekrut.",
  },
];

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="divide-y divide-line rounded-card border border-line bg-white">
      {FAQS.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="faq-item">
            <h3 className="text-base font-semibold">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 rounded-card px-6 py-5 text-left font-bold text-ink hover:text-navy cursor-pointer transition-colors"
                aria-expanded={isOpen}
                aria-controls={faq.id}
                onClick={() => toggle(faq.id)}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div id={faq.id} role="region" className="px-6 pb-6 text-muted">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

