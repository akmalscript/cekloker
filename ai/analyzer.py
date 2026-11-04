import json
import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompts import build_system_prompt
from redflags import RED_FLAGS
from schema import AnalysisResult
from scoring import hitung_risiko

load_dotenv()

# Ganti lewat .env (GEMINI_MODEL). Cek nama model terbaru di Google AI Studio.
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
FALLBACK = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash")  # dipakai bila model utama sibuk (503)
_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

DISCLAIMER = (
    "Hasil ini adalah indikasi risiko dari alat bantu AI, bukan keputusan hukum "
    "dan bukan jaminan lowongan pasti aman atau pasti penipuan."
)


def retrieve_context(teks_query: str) -> str:
    """TODO (langkah RAG): cari rujukan relevan (red flag, dasar hukum,
    laporan penipuan) lalu kembalikan sebagai teks. Sementara kosong."""
    return ""


def _panggil_model(contents, system_prompt: str, percobaan: int = 6):
    daftar_model = [MODEL] + ([FALLBACK] if FALLBACK and FALLBACK != MODEL else [])
    for i in range(percobaan):
        model = daftar_model[i % len(daftar_model)]
        try:
            return _client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.1,
                ),
            )
        except Exception as e:
            kode = getattr(e, "code", None)
            # hanya ulang untuk error sementara; sisanya langsung dilaporkan
            if kode not in (429, 500, 503) or i == percobaan - 1:
                raise
            time.sleep(min(5 * 2**i, 30))  # 5, 10, 20, 30 detik


def analisis(gambar: list[tuple[bytes, str]], teks: str | None = None) -> dict:
    """gambar: list (bytes, mime_type). teks: teks lowongan/chat opsional."""
    contents = [types.Part.from_bytes(data=b, mime_type=m) for b, m in gambar]
    if teks:
        contents.append(f"Teks lowongan/chat:\n{teks}")
    contents.append("Periksa input di atas sesuai instruksi.")

    system_prompt = build_system_prompt(retrieve_context(teks or ""))
    resp = _panggil_model(contents, system_prompt)

    hasil: AnalysisResult = resp.parsed or AnalysisResult(**json.loads(resp.text))
    data = hasil.model_dump(mode="json")

    # Perkaya tiap red flag dengan label, bobot, dan dasar hukum dari redflags.py
    for f in data["red_flags"]:
        meta = RED_FLAGS[f["kode"]]
        f["label"] = meta["label"]
        f["bobot"] = meta["weight"]
        f["dasar_hukum"] = meta["legal"]

    data.update(hitung_risiko([f["kode"] for f in data["red_flags"]], data["keyakinan"]))
    data["disclaimer"] = DISCLAIMER
    return data
