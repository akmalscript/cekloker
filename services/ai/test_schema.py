"""
Test kontrak schema.py.

Tiga jenis test:
  1. Golden JSON di docs/contracts/ divalidasi AnalysisResult — kalau schema berubah
     tanpa mengupdate contoh, test ini gagal.
  2. Validator Pydantic (BBox, Fingerprint, level_coherent_with_flags).
  3. Test OpenAPI — pastikan AnalysisResult muncul di /openapi.json FastAPI.

Jalankan: pytest services/ai/test_schema.py -v
"""
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from schema import AnalysisResult, BBox, Fingerprint, RiskLevel, FlagSeverity

CONTRACTS_DIR = Path(__file__).resolve().parents[2] / "docs" / "contracts"
GOLDEN_FILES = list(CONTRACTS_DIR.glob("example_*.json"))


# ─── Golden contract examples ──────────────────────────────────────────────────

class TestGoldenContracts:
    @pytest.mark.parametrize("path", GOLDEN_FILES, ids=lambda p: p.stem)
    def test_validates_against_schema(self, path: Path):
        """Setiap contoh JSON di docs/contracts/ harus valid sebagai AnalysisResult."""
        raw = path.read_text(encoding="utf-8")
        result = AnalysisResult.model_validate_json(raw)
        assert result.schema_version == "1.0"

    def test_all_risk_levels_covered(self):
        """Pastikan ada contoh untuk setiap risk_level."""
        levels = {
            AnalysisResult.model_validate_json(p.read_text()).risk_level
            for p in GOLDEN_FILES
        }
        missing = {"aman", "waspada", "bahaya"} - levels
        assert not missing, f"Contoh kurang untuk risk_level: {missing}"

    def test_aman_example_has_no_red_flags(self):
        aman = next(p for p in GOLDEN_FILES if "aman" in p.stem)
        result = AnalysisResult.model_validate_json(aman.read_text())
        assert result.red_flags == []

    def test_bahaya_example_has_bahaya_flags(self):
        bahaya = next(p for p in GOLDEN_FILES if "bahaya" in p.stem)
        result = AnalysisResult.model_validate_json(bahaya.read_text())
        assert any(f.severity == "bahaya" for f in result.red_flags)


# ─── BBox validator ────────────────────────────────────────────────────────────

class TestBBox:
    def test_valid_bbox(self):
        b = BBox(x=0.1, y=0.4, w=0.5, h=0.1)
        assert b.x == 0.1

    def test_zero_width_rejected(self):
        with pytest.raises(ValidationError):
            BBox(x=0.1, y=0.4, w=0.0, h=0.1)

    def test_zero_height_rejected(self):
        with pytest.raises(ValidationError):
            BBox(x=0.1, y=0.4, w=0.3, h=0.0)

    def test_out_of_bounds_x_plus_w(self):
        with pytest.raises(ValidationError, match="keluar dari batas"):
            BBox(x=0.8, y=0.1, w=0.5, h=0.1)   # 0.8 + 0.5 = 1.3 > 1

    def test_out_of_bounds_y_plus_h(self):
        with pytest.raises(ValidationError, match="keluar dari batas"):
            BBox(x=0.1, y=0.9, w=0.1, h=0.5)   # 0.9 + 0.5 = 1.4 > 1

    def test_exact_boundary_allowed(self):
        """x + w == 1.0 harus lolos."""
        b = BBox(x=0.5, y=0.5, w=0.5, h=0.5)
        assert b.x + b.w <= 1.0 + 1e-6


# ─── Fingerprint hex validator ─────────────────────────────────────────────────

class TestFingerprint:
    def test_valid_phash(self):
        f = Fingerprint(
            image_phash=["a1b2c3d4e5f67890"],
            raw_text="teks mentah",
            normalized_text="teks mentah",
        )
        assert len(f.image_phash) == 1

    def test_phash_too_short_rejected(self):
        with pytest.raises(ValidationError, match="16 karakter"):
            Fingerprint(
                image_phash=["abc123"],   # kurang dari 16 char
                raw_text="teks",
                normalized_text="teks",
            )

    def test_phash_uppercase_rejected(self):
        with pytest.raises(ValidationError, match="16 karakter"):
            Fingerprint(
                image_phash=["A1B2C3D4E5F67890"],   # uppercase tidak valid
                raw_text="teks",
                normalized_text="teks",
            )

    def test_empty_phash_list_allowed(self):
        """Input teks tanpa gambar: image_phash boleh kosong."""
        f = Fingerprint(image_phash=[], raw_text="teks", normalized_text="teks")
        assert f.image_phash == []

    def test_multiple_phash_allowed(self):
        f = Fingerprint(
            image_phash=["a1b2c3d4e5f67890", "b2c3d4e5f6789012"],
            raw_text="teks",
            normalized_text="teks",
        )
        assert len(f.image_phash) == 2


# ─── Invariant level_coherent_with_flags ──────────────────────────────────────

class TestLevelCoherence:
    def _base(self) -> dict:
        return json.loads((CONTRACTS_DIR / "example_aman.json").read_text())

    def test_aman_with_bahaya_flag_rejected(self):
        data = self._base()
        data["red_flags"] = [{
            "code": "paspor_ditahan",
            "label": "Penahanan dokumen",
            "severity": "bahaya",
            "quote": "test",
            "reason": "test",
            "legal_basis": None,
            "regions": [],
        }]
        with pytest.raises(ValidationError, match="tidak konsisten"):
            AnalysisResult.model_validate(data)

    def test_bahaya_with_bahaya_flag_allowed(self):
        data = json.loads((CONTRACTS_DIR / "example_bahaya.json").read_text())
        result = AnalysisResult.model_validate(data)
        assert result.risk_level == "bahaya"


# ─── OpenAPI ──────────────────────────────────────────────────────────────────

class TestOpenAPI:
    def test_analysis_result_in_openapi(self):
        """AnalysisResult harus muncul di schema OpenAPI FastAPI."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schemas = resp.json().get("components", {}).get("schemas", {})
        assert "AnalysisResult" in schemas or any(
            "AnalysisResult" in str(v) for v in schemas.values()
        ), "AnalysisResult tidak ditemukan di OpenAPI schema"
