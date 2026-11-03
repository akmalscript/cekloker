"""
Normalisasi teks untuk pencocokan scam (scam matching).

Fungsi normalize() menghasilkan string deterministik yang bisa disimpan di DB
dan dicocokkan dengan word_similarity() pg_trgm.

NORMALIZATION_VERSION harus dinaikkan setiap aturan diubah, supaya data
lama di DB bisa dinormalisasi ulang tanpa memanggil AI lagi.

Aturan (urutan penting):
  1. Unicode NFKC  — normalisasi karakter bergaya/lebar penuh (umum dipakai penipu)
  2. casefold      — lowercase lintas bahasa (lebih kuat dari .lower())
  3. Karakter di luar [a-z 0-9 @ . , : / - + _] diganti spasi
     (mempertahankan sinyal kontak: @username, wa.me/628xxx, email, +62xxx)
  4. Whitespace berurutan → satu spasi, lalu trim
"""
import re
import unicodedata

NORMALIZATION_VERSION = "1"

# Pertahankan: huruf, angka, dan karakter yang sering muncul di kontak/URL
_KEEP = re.compile(r"[^\w@.,:/\-+]", re.UNICODE)
# Whitespace berurutan
_SPACES = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Normalisasi teks untuk disimpan di DB dan dipakai word_similarity pg_trgm.

    Args:
        text: Teks mentah hasil ekstraksi dari gambar atau input pengguna.

    Returns:
        String dinormalisasi, siap disimpan di kolom normalized_text.
    """
    if not text:
        return ""
    # 1. Unicode NFKC — tangkap karakter bergaya (ａ→a, ＠→@, ① dst.)
    text = unicodedata.normalize("NFKC", text)
    # 2. casefold — lowercase lintas bahasa
    text = text.casefold()
    # 3. Ganti karakter di luar set yang diizinkan dengan spasi
    text = _KEEP.sub(" ", text)
    # 4. Collapse whitespace dan trim
    return _SPACES.sub(" ", text).strip()

