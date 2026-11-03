"""
Test integritas katalog red flag CekLoker.

Jalankan: pytest services/ai/test_catalog.py -v
"""
import json
from pathlib import Path

import pytest

from catalog import Catalog, CatalogEntry, get_catalog

CATALOG_PATH = Path(__file__).resolve().parents[2] / "catalog" / "redflags.json"


@pytest.fixture(autouse=True)
def clear_lru_cache():
    get_catalog.cache_clear()
    yield
    get_catalog.cache_clear()


# ---------------------------------------------------------------------------
# File dan struktur JSON
# ---------------------------------------------------------------------------

class TestCatalogFile:
    def test_file_exists(self):
        assert CATALOG_PATH.exists(), f"Katalog tidak ditemukan di {CATALOG_PATH}"

    def test_valid_json(self):
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        assert "version" in data, "Field 'version' tidak ada"
        assert "entries" in data, "Field 'entries' tidak ada"
        assert isinstance(data["entries"], list), "'entries' harus array"

    def test_loads_without_error(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        catalog = get_catalog()
        assert catalog.version
        assert len(catalog.entries) > 0

    def test_minimum_entry_count(self, monkeypatch):
        """Pastikan tidak ada entri yang terhapus secara tidak sengaja."""
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        catalog = get_catalog()
        assert len(catalog.entries) >= 14, (
            f"Jumlah entri kurang dari yang diharapkan: {len(catalog.entries)}"
        )


# ---------------------------------------------------------------------------
# Kode kanonik
# ---------------------------------------------------------------------------

class TestCanonicalCodes:
    def test_paspor_ditahan_exists(self, monkeypatch):
        """Regression: kode kanonik 'paspor_ditahan' harus ada."""
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        codes = {e.code for e in get_catalog().entries}
        assert "paspor_ditahan" in codes, (
            "Kode kanonik 'paspor_ditahan' tidak ditemukan di katalog"
        )

    def test_paspor_dititipkan_not_exists(self, monkeypatch):
        """Regression: kode lama 'paspor_dititipkan' tidak boleh ada."""
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        codes = {e.code for e in get_catalog().entries}
        assert "paspor_dititipkan" not in codes, (
            "Kode non-kanonik 'paspor_dititipkan' ditemukan; gunakan 'paspor_ditahan'"
        )

    def test_no_duplicate_codes(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        codes = [e.code for e in get_catalog().entries]
        assert len(codes) == len(set(codes)), f"Kode duplikat: {set(c for c in codes if codes.count(c) > 1)}"

    def test_all_codes_snake_case(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        for entry in get_catalog().entries:
            assert entry.code == entry.code.lower(), f"Kode bukan lowercase: {entry.code}"
            assert " " not in entry.code, f"Kode mengandung spasi: {entry.code}"


# ---------------------------------------------------------------------------
# Konsistensi severity vs weight
# ---------------------------------------------------------------------------

class TestSeverityWeight:
    def test_bahaya_weight_gte_4(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        for entry in get_catalog().entries:
            if entry.severity == "bahaya":
                assert entry.weight >= 4, (
                    f"[{entry.code}] severity 'bahaya' butuh weight >= 4, dapat {entry.weight}"
                )

    def test_waspada_weight_lte_3(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        for entry in get_catalog().entries:
            if entry.severity == "waspada":
                assert entry.weight <= 3, (
                    f"[{entry.code}] severity 'waspada' butuh weight <= 3, dapat {entry.weight}"
                )

    def test_bahaya_entries_have_legal_basis(self, monkeypatch):
        """Flag bahaya harus mencantumkan dasar hukum (meski belum diverifikasi)."""
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        for entry in get_catalog().entries:
            if entry.severity == "bahaya":
                assert entry.legal_basis is not None, (
                    f"[{entry.code}] severity 'bahaya' harus punya legal_basis"
                )

    def test_by_code_length_matches_entries(self, monkeypatch):
        monkeypatch.setenv("CATALOG_PATH", str(CATALOG_PATH))
        catalog = get_catalog()
        assert len(catalog.by_code()) == len(catalog.entries)


# ---------------------------------------------------------------------------
# Validasi Pydantic (unit test, tanpa file)
# ---------------------------------------------------------------------------

class TestCatalogEntryValidation:
    def test_bahaya_rejects_low_weight(self):
        with pytest.raises(Exception, match="weight >= 4"):
            CatalogEntry(
                code="test_kode",
                label="Test",
                description="Deskripsi test",
                severity="bahaya",
                weight=3,
            )

    def test_waspada_rejects_high_weight(self):
        with pytest.raises(Exception, match="weight <= 3"):
            CatalogEntry(
                code="test_kode",
                label="Test",
                description="Deskripsi test",
                severity="waspada",
                weight=4,
            )

    def test_invalid_code_format_rejected(self):
        with pytest.raises(Exception):
            CatalogEntry(
                code="Test-Kode",  # uppercase + tanda hubung: tidak valid
                label="Test",
                description="Deskripsi test",
                severity="waspada",
                weight=2,
            )

    def test_valid_bahaya_entry(self):
        entry = CatalogEntry(
            code="paspor_ditahan",
            label="Penahanan dokumen",
            description="Deskripsi test",
            severity="bahaya",
            weight=4,
        )
        assert entry.severity == "bahaya"

    def test_valid_waspada_entry(self):
        entry = CatalogEntry(
            code="gaji_tidak_wajar",
            label="Gaji tidak wajar",
            description="Deskripsi test",
            severity="waspada",
            weight=2,
        )
        assert entry.severity == "waspada"

    def test_legal_basis_optional_for_waspada(self):
        entry = CatalogEntry(
            code="kirim_apk",
            label="Kiriman APK",
            description="Deskripsi test",
            severity="waspada",
            weight=3,
            legal_basis=None,
        )
        assert entry.legal_basis is None

