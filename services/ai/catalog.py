"""
Catalog loader untuk daftar red flag CekLoker.

Sumber kebenaran tunggal: catalog/redflags.json di root repo.
Untuk Docker, override path lewat env var CATALOG_PATH.

Untuk test, ganti path dan bersihkan cache:
    monkeypatch.setenv("CATALOG_PATH", str(path))
    get_catalog.cache_clear()
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# File ini di services/ai/catalog.py
# parents[0] = services/ai/  |  parents[1] = services/  |  parents[2] = repo root
_DEFAULT_PATH = Path(__file__).resolve().parents[2] / "catalog" / "redflags.json"


class CatalogEntry(BaseModel):
    code: str = Field(pattern=r"^[a-z0-9_]+$")
    label: str
    description: str
    severity: Literal["bahaya", "waspada"]
    weight: int = Field(ge=1, le=10)
    legal_basis: str | None = None
    legal_basis_verified: bool = False

    @model_validator(mode="after")
    def severity_consistent_with_weight(self) -> "CatalogEntry":
        if self.severity == "bahaya" and self.weight < 4:
            raise ValueError(
                f"[{self.code}] severity 'bahaya' requires weight >= 4, got {self.weight}"
            )
        if self.severity == "waspada" and self.weight >= 4:
            raise ValueError(
                f"[{self.code}] severity 'waspada' requires weight <= 3, got {self.weight}"
            )
        return self


class Catalog(BaseModel):
    version: str
    entries: list[CatalogEntry]

    @model_validator(mode="after")
    def codes_unique(self) -> "Catalog":
        codes = [e.code for e in self.entries]
        dupes = {c for c in codes if codes.count(c) > 1}
        if dupes:
            raise ValueError(f"Kode duplikat di katalog: {sorted(dupes)}")
        return self

    def by_code(self) -> dict[str, CatalogEntry]:
        return {e.code: e for e in self.entries}


@lru_cache(maxsize=1)
def get_catalog() -> Catalog:
    path = Path(os.environ.get("CATALOG_PATH", str(_DEFAULT_PATH)))
    return Catalog.model_validate_json(path.read_text(encoding="utf-8"))

