"""Tingkat risiko dihitung dengan kode, BUKAN oleh model, supaya konsisten
dan bisa dijelaskan ke juri. Bobot dan severity diambil dari katalog
(catalog/redflags.json). Ambang batas = tebakan awal, tuning setelah uji.
"""
from catalog import get_catalog

AMBANG_BAHAYA = 6
AMBANG_WASPADA = 3
KEYAKINAN_MIN = 0.6  # di bawah ini, sarankan pengguna cek manual


def hitung_risiko(kodes: list[str], keyakinan: float) -> dict:
    """Return {risk_level, risk_score, needs_manual_check} sesuai kontrak (huruf kecil)."""
    katalog = get_catalog().by_code()
    unik = {k for k in kodes if k in katalog}
    skor = sum(katalog[k].weight for k in unik)
    ada_bahaya = any(katalog[k].severity == "bahaya" for k in unik)
    if ada_bahaya or skor >= AMBANG_BAHAYA:
        level = "bahaya"
    elif skor >= AMBANG_WASPADA:
        level = "waspada"
    else:
        level = "aman"
    return {
        "risk_level": level,
        "risk_score": skor,
        "needs_manual_check": keyakinan < KEYAKINAN_MIN,
    }
