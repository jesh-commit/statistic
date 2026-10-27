from __future__ import annotations
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Statistic Report API", version="0.1.0")
DEFAULT_ORIGINS = ["http://localhost:5173", "https://statistic-2su.pages.dev"]
configured_origins = [origin.strip() for origin in __import__("os").environ.get("CORS_ORIGINS", "").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or DEFAULT_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
ALLOWED_SUFFIXES = {".xlsb", ".xlsx", ".xls"}
PREVIEW_LIMIT = 8

def json_value(value: Any) -> Any:
    if pd.isna(value): return None
    if hasattr(value, "isoformat"): return value.isoformat()
    if hasattr(value, "item"): return value.item()
    return value if isinstance(value, (str, int, float, bool)) else str(value)

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status":"ok","service":"statistic-report-api"}

@app.post("/api/preview")
async def preview(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "source.xlsx"
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Format non pris en charge. Utilise .xlsb, .xlsx ou .xls.")
    payload = await file.read()
    if not payload: raise HTTPException(status_code=400, detail="Le fichier est vide.")
    temp_path: str | None = None
    try:
        with NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(payload)
            temp_path = temp.name
        try:
            frame = pd.read_excel(temp_path, engine="calamine", dtype=object)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Lecture Excel impossible : {exc}") from exc
        frame = frame.astype(object).where(pd.notna(frame), None)
        columns = [str(column) for column in frame.columns]
        rows = [{columns[i]: json_value(value) for i, value in enumerate(row)} for row in frame.head(PREVIEW_LIMIT).itertuples(index=False, name=None)]
        warnings: list[str] = []
        if frame.empty: warnings.append("Aucune ligne de données détectée dans la première feuille.")
        if not columns: warnings.append("Aucune colonne détectée. Vérifie la feuille et la ligne d’en-tête.")
        return {"filename":filename,"columns":columns,"rows":rows,"row_count":int(len(frame)),"warnings":warnings}
    finally:
        if temp_path: Path(temp_path).unlink(missing_ok=True)
