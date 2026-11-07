import { Suspense } from "react";
import ResultClient from "./ResultClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";

export function generateStaticParams() {
  return [
    { id: "kamboja" },
    { id: "jepang" },
    { id: "taiwan" },
    { id: "demo" },
  ];
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="flex-1 bg-canvas py-16">
            <div className="container-page max-w-2xl text-center space-y-4">
              <Loader2 className="mx-auto h-10 w-10 text-navy animate-spin" />
              <h2 className="text-xl font-bold text-ink">Memuat Hasil Pemeriksaan...</h2>
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <ResultClient id={id} />
    </Suspense>
  );
}
