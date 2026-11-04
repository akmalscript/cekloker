"""Pencarian lokal (BM25 sederhana) di basis pengetahuan. Tanpa API, tanpa kuota."""
import math
import re
from collections import Counter

from .chunks import KB

_STOP = set("dan yang di ke dari untuk dengan ini itu atau pada akan kak ya kok dong aja saya kami kita anda kakak sudah belum bisa ada tidak nanti juga sebagai dalam oleh adalah".split())


def _tok(s: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", s.lower()) if t not in _STOP and len(t) > 1]


def aktif() -> list[dict]:
    """Hanya potongan yang placeholder-nya sudah diisi."""
    return [c for c in KB if "[ISI" not in c["isi"]]


def nonaktif() -> list[str]:
    return [c["id"] for c in KB if "[ISI" in c["isi"]]


def _dokumen(c: dict) -> list[str]:
    # kata kunci dihitung 3x supaya bobotnya lebih besar dari isi
    return _tok(c["judul"]) + _tok(c["isi"]) + _tok(" ".join(c["kata_kunci"])) * 3


_DOCS = None


def _index():
    global _DOCS
    if _DOCS is None:
        chunks = aktif()
        toks = [_dokumen(c) for c in chunks]
        n = len(chunks)
        df = Counter(t for d in toks for t in set(d))
        avg = sum(len(d) for d in toks) / max(n, 1)
        _DOCS = (chunks, toks, df, n, avg)
    return _DOCS


def cari(query: str, k: int = 4, min_skor: float = 5.0) -> list[dict]:
    chunks, toks, df, n, avg = _index()
    q = _tok(query)
    if not q or not chunks:
        return []
    hasil = []
    for c, d in zip(chunks, toks):
        tf = Counter(d)
        skor = 0.0
        for t in set(q):
            if t not in tf:
                continue
            idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
            f = tf[t]
            skor += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * len(d) / avg))
        if skor >= min_skor:
            hasil.append((skor, c))
    hasil.sort(key=lambda x: -x[0])
    return [dict(c, skor=round(s, 2)) for s, c in hasil[:k]]


def format_konteks(hasil: list[dict]) -> str:
    return "\n".join(f"[{h['id']}] {h['judul']}: {h['isi']}" for h in hasil)
