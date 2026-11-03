"""Tingkat risiko dihitung dengan kode, BUKAN oleh model, supaya konsisten
dan bisa dijelaskan ke juri. Ambang batas = tebakan awal, tuning setelah uji.
"""
from redflags import RED_FLAGS, CRITICAL

AMBANG_BAHAYA = 6
AMBANG_WASPADA = 3
KEYAKINAN_MIN = 0.6  # di bawah ini, sarankan pengguna cek manual


def hitung_risiko(kodes: list[str], keyakinan: float) -> dict:
    unik = set(kodes)
    skor = sum(RED_FLAGS[k]["weight"] for k in unik)
    if unik & CRITICAL or skor >= AMBANG_BAHAYA:
        level = "Bahaya"
    elif skor >= AMBANG_WASPADA:
        level = "Waspada"
    else:
        level = "Aman"
    return {
        "risk_level": level,
        "risk_score": skor,
        "saran_cek_manual": keyakinan < KEYAKINAN_MIN,
    }
