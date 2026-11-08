import { NextRequest, NextResponse } from "next/server";
import { getScan } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scan = await getScan(id);

  if (!scan) {
    return NextResponse.json(
      {
        error: "Hasil pemeriksaan tidak ditemukan atau telah kedaluwarsa.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(scan);
}
