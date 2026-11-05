"""Pengecek kelengkapan data uji. Pemakaian: python cek_data.py [folder]  (default data_nyata)"""
import csv
import re
import sys
from collections import Counter
from pathlib import Path

from redflags import RED_FLAGS

F = Path(sys.argv[1] if len(sys.argv) > 1 else "data_nyata")
EXT = {".png", ".jpg", ".jpeg", ".webp"}
masalah: list[str] = []


def baca(nama):
    p = F / nama
    if not p.exists():
        masalah.append(f"{nama} tidak ada")
        return []
    return list(csv.DictReader(open(p, encoding="utf-8")))


labels, sumber = baca("labels.csv"), baca("sumber.csv")
gambar = {p.name for p in F.iterdir() if p.suffix.lower() in EXT}

def dobel(rows, nama):
    for k, n in Counter(r["file"] for r in rows).items():
        if n > 1:
            masalah.append(f"{nama}: baris ganda untuk {k}")

dobel(labels, "labels.csv"); dobel(sumber, "sumber.csv")
L = {r["file"]: r for r in labels}
S = {r["file"]: r for r in sumber}

for g in sorted(gambar):
    if g not in L: masalah.append(f"{g}: belum ada di labels.csv")
    if g not in S: masalah.append(f"{g}: belum ada di sumber.csv")
for f in L:
    if f not in gambar: masalah.append(f"{f}: ada di labels.csv tapi filenya tidak ada")
for f in S:
    if f not in gambar: masalah.append(f"{f}: ada di sumber.csv tapi filenya tidak ada")

for f, r in L.items():
    if r["label"] not in ("jebakan", "asli"):
        masalah.append(f"{f}: label harus 'jebakan' atau 'asli', bukan '{r['label']}'")
    for k in filter(None, (r["red_flag_yang_diharapkan"] or "").split(";")):
        if k not in RED_FLAGS:
            masalah.append(f"{f}: kode flag tidak dikenal '{k}'")
    if r["label"] == "asli" and r["red_flag_yang_diharapkan"]:
        masalah.append(f"{f}: sampel 'asli' tidak boleh punya red flag diharapkan")
    if r.get("jenis") not in ("biasa", "sulit", "tanpa_petunjuk_visual"):
        masalah.append(f"{f}: jenis harus biasa/sulit/tanpa_petunjuk_visual")

for f, r in S.items():
    if not re.match(r"https?://", r["url"] or ""):
        masalah.append(f"{f}: url sumber kosong/bukan http(s)")
    if not re.match(r"\d{4}-\d{2}-\d{2}$", r["tanggal_ambil"] or ""):
        masalah.append(f"{f}: tanggal_ambil harus YYYY-MM-DD")
    if not r["kelompok"]:
        masalah.append(f"{f}: kelompok kosong (isi nama unik, atau sama dengan versi lain postingan itu)")
    if r["disamarkan"] not in ("ya", "tidak"):
        masalah.append(f"{f}: disamarkan harus 'ya' atau 'tidak'")

print(f"Gambar: {len(gambar)} | labels: {len(L)} | sumber: {len(S)}")
c = Counter(r["label"] for r in L.values())
print(f"Jebakan: {c['jebakan']} (target 8-10) | Asli: {c['asli']} (target 8-10)")
print("Jenis  :", dict(Counter(r.get("jenis") for r in L.values())))
print("Kelompok unik:", len({r["kelompok"] for r in S.values()}))
if masalah:
    print(f"\n{len(masalah)} MASALAH:")
    for m in masalah: print(" -", m)
    sys.exit(1)
print("\nSemua rapi.")
