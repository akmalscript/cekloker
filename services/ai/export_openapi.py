"""Ekspor OpenAPI specification dari Pydantic schema dengan penyesuaian ref path.
"""
import json
from pathlib import Path
from schema import AnalysisResult

def generate_openapi():
    json_schema = AnalysisResult.model_json_schema()
    defs = json_schema.pop("$defs", {})
    defs["AnalysisResult"] = json_schema

    # Convert to JSON string and rewrite $defs references to OpenAPI components/schemas
    raw_defs_str = json.dumps(defs).replace('"#/$defs/', '"#/components/schemas/')
    resolved_schemas = json.loads(raw_defs_str)

    openapi_spec = {
        "openapi": "3.1.0",
        "info": {
            "title": "CekLoker AI",
            "version": "1.0.0",
            "description": "Layanan Analisis Cerdas CekLoker berbasis Gemini AI"
        },
        "paths": {
            "/health": {
                "get": {
                    "summary": "Health Check",
                    "operationId": "health_check",
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {"ok": {"type": "boolean"}}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/analyze": {
                "post": {
                    "summary": "Analyze Job Posting",
                    "operationId": "analyze_posting",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "multipart/form-data": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "files": {
                                            "type": "array",
                                            "items": {"type": "string", "format": "binary"},
                                            "description": "Maksimal 5 berkas (JPG/PNG/WEBP/PDF)"
                                        },
                                        "teks": {
                                            "type": "string",
                                            "description": "Teks lowongan atau percakapan (opsional)"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Hasil evaluasi risiko dan red flag",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/AnalysisResult"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Input tidak valid"
                        },
                        "422": {
                            "description": "Analysis Error"
                        },
                        "502": {
                            "description": "Layanan AI gagal"
                        }
                    }
                }
            }
        },
        "components": {
            "schemas": resolved_schemas
        }
    }

    out_path = Path(__file__).parent / "openapi.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(openapi_spec, f, indent=2)
    print(f"OpenAPI spec successfully written to {out_path}")

if __name__ == "__main__":
    generate_openapi()
