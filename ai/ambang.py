"""Analisis ambang skor dari hasil eval yang sudah ada (TANPA memanggil API).

Pemakaian: python ambang.py hasil_eval_tanpa_rag.json hasil_eval_dengan_rag.json

Catatan jujur: ambang yang dipilih dari data uji ini sendiri akan terlihat lebih
bagus daripada kenyataannya. Laporkan ambang 3 (ditetapkan SEBELUM uji) sebagai
hasil utama, dan tabel ini sebagai analisis eksploratif.
"""
import json
import sys

from redflags import CRITICAL


def ditandai(h, ambang):
    kodes = {f["kode"] for f in h["red_flags"]}
    return h["risk_score"] >= ambang or bool(kodes & CRITICAL)


for path in sys.argv[1:]:
    data = json.load(open(path, encoding="utf-8"))
    jeb = [d for d in data if d["label"] == "jebakan"]
    asl = [d for d in data if d["label"] == "asli"]
    print(f"\n{path}  ({len(jeb)} jebakan, {len(asl)} asli)")
    print("  skor jebakan:", sorted(d["hasil"]["risk_score"] for d in jeb))
    print("  skor asli   :", sorted(d["hasil"]["risk_score"] for d in asl))
    print("  ambang | recall jebakan | alarm palsu")
    for t in (1, 2, 3, 4):
        tp = sum(ditandai(d["hasil"], t) for d in jeb)
        fp = sum(ditandai(d["hasil"], t) for d in asl)
        tanda = "  <- dipakai sekarang" if t == 3 else ""
        print(f"    >= {t} | {tp:>2}/{len(jeb)}          | {fp:>2}/{len(asl)}{tanda}")
