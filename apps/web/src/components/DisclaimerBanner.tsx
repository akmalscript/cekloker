import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  variant?: "general" | "official_unfound";
  className?: string;
}

export function DisclaimerBanner({ variant = "general", className }: DisclaimerProps) {
  if (variant === "official_unfound") {
    return (
      <div className={cn("alert alert-info", className)} role="note">
        <Info className="h-5 w-5 shrink-0 text-navy mt-0.5" aria-hidden="true" />
        <p className="text-sm">
          <strong>Catatan penting:</strong> Status &quot;tidak ditemukan&quot; pada basis data resmi bukan bukti bahwa suatu perusahaan otomatis ilegal/kriminal, melainkan menunjukkan ketiadaan jaminan pelindungan hukum ketenagakerjaan resmi dari negara RI.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("alert alert-info", className)} role="note">
      <Info className="h-5 w-5 shrink-0 text-navy mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        {/* Format Ringkas untuk Mobile */}
        <p className="sm:hidden">
          <strong>Penting:</strong> Hasil analisis AI merupakan alat bantu pemeriksaan dan bukan keputusan hukum atau jaminan bahwa suatu lowongan pasti aman.
        </p>
        {/* Format Komprehensif untuk Desktop */}
        <p className="hidden sm:block">
          <strong>Batasan Hasil Pemeriksaan:</strong> Hasil analisis ini dibuat secara otomatis oleh model kecerdasan buatan (<em>AI Analysis Service</em>) berdasarkan pola indikasi risiko. Analisis ini merupakan alat bantu penilaian awal (<em>preliminary risk assessment</em>) dan bukan merupakan putusan hukum resmi atau jaminan mutlak. Selalu lakukan verifikasi mandiri melalui kanal resmi pemerintah sebelum mengambil keputusan kerja.
        </p>
      </div>
    </div>
  );
}
