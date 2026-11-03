"""
Test normalize() dengan golden cases.

Jalankan: pytest services/ai/test_normalize.py -v
"""
import pytest
from normalize import normalize, NORMALIZATION_VERSION


class TestNormalizationVersion:
    def test_version_is_string(self):
        assert isinstance(NORMALIZATION_VERSION, str)
        assert NORMALIZATION_VERSION  # tidak kosong


class TestBasicNormalization:
    def test_empty_string(self):
        assert normalize("") == ""

    def test_none_equivalent(self):
        """Pastikan tidak raise untuk string kosong."""
        assert normalize("   ") == ""

    def test_lowercase(self):
        assert normalize("Paspor DITITIPKAN ke Agen") == "paspor dititipkan ke agen"

    def test_trim_whitespace(self):
        assert normalize("  hello  ") == "hello"

    def test_collapse_internal_whitespace(self):
        assert normalize("gaji   tidak   wajar") == "gaji tidak wajar"

    def test_newlines_collapsed(self):
        assert normalize("posisi:\nCS Online\ntujuan: Kamboja") == "posisi: cs online tujuan: kamboja"


class TestUnicodeNormalization:
    def test_nfkc_fullwidth(self):
        """Karakter lebar penuh (fullwidth) → ASCII biasa."""
        # ａ (U+FF41) → a, ０ (U+FF10) → 0
        assert normalize("ａｄｍｉｎ　ｏｎｌｉｎｅ") == "admin online"

    def test_nfkc_stylized(self):
        """Huruf bergaya yang sering dipakai penipu."""
        # 𝐆𝐚𝐣𝐢 (Mathematical Bold) → Gaji
        assert normalize("𝐆𝐚𝐣𝐢 𝐓𝐢𝐝𝐚𝐤 𝐖𝐚𝐣𝐚𝐫") == "gaji tidak wajar"

    def test_nfkc_circled_numbers(self):
        """Angka lingkaran (① ② ③) di-normalize ke angka biasa."""
        assert "1" in normalize("①②③")

    def test_casefold_german(self):
        """casefold lebih kuat dari lower() untuk karakter non-ASCII."""
        assert normalize("ß") == "ss"


class TestContactPreservation:
    """Karakter kontak tidak boleh hilang — ini sinyal pencocokan penting."""

    def test_at_sign_preserved(self):
        assert normalize("Hubungi @adminCS") == "hubungi @admincs"

    def test_phone_number_preserved(self):
        assert normalize("+628123456789") == "+628123456789"

    def test_whatsapp_link_preserved(self):
        assert normalize("Klik wa.me/628123456789") == "klik wa.me/628123456789"

    def test_email_preserved(self):
        assert normalize("Email: admin@rekrut.com") == "email: admin@rekrut.com"

    def test_telegram_username_preserved(self):
        assert normalize("Telegram: @recruiter_id") == "telegram: @recruiter_id"

    def test_url_slash_preserved(self):
        assert normalize("https://bp2mi.go.id/check") == "https://bp2mi.go.id/check"


class TestRemovedCharacters:
    """Karakter yang tidak ada di allowlist harus diganti spasi."""

    def test_exclamation_removed(self):
        assert "!" not in normalize("Daftar Sekarang!!!")

    def test_asterisk_removed(self):
        assert "*" not in normalize("**URGENT** Lowongan")

    def test_bracket_removed(self):
        result = normalize("Gaji [USD 5000]")
        assert "[" not in result and "]" not in result

    def test_emoji_removed(self):
        result = normalize("Lowongan 🔥 CS Online 💰")
        assert "🔥" not in result and "💰" not in result


class TestIdempotence:
    """normalize(normalize(x)) harus == normalize(x) untuk semua input."""

    @pytest.mark.parametrize("raw", [
        "Paspor DITITIPKAN ke Agen!!!",
        "ａｄｍｉｎ　ｏｎｌｉｎｅ",
        "Hub: @recruiter_id  |  wa.me/628123456789",
        "gaji   tidak\n\nwajar",
        "𝐆𝐚𝐣𝐢 Tidak Wajar",
        "email: admin@rekrut.co.id",
        "",
        "   ",
        "①② Lowongan URGENT !!  ",
    ])
    def test_idempotent(self, raw):
        once = normalize(raw)
        twice = normalize(once)
        assert once == twice, f"Tidak idempoten untuk: {raw!r}\n  once={once!r}\n  twice={twice!r}"


class TestGoldenCases:
    """End-to-end golden cases dari contoh poster scam nyata."""

    def test_scam_kamboja_snippet(self):
        raw = "DICARI!! CS ONLINE\nGaji: $3.000/bulan\nBerangkat SEGERA pakai visa turis\nHub: @admin_kamboja"
        result = normalize(raw)
        assert "cs online" in result
        assert "@admin_kamboja" in result
        assert "visa turis" in result
        # tanda seru dan $ hilang, tidak menyebabkan error
        assert "!" not in result
        assert "$" not in result

    def test_legitimate_job_snippet(self):
        raw = "PT. Maju Bersama Indonesia\nJl. Sudirman No. 10, Jakarta\nKontak: hr@majubersama.co.id"
        result = normalize(raw)
        assert "pt. maju bersama indonesia" in result
        assert "hr@majubersama.co.id" in result

