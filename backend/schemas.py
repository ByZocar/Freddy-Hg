"""Schemas Pydantic compartidos entre routers."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ─── Ingesta de detecciones desde el pipeline GEE ──────────────────
class RawAlertPayload(BaseModel):
    scene_id: str
    scene_date_utc: str
    centroid_lat: float = Field(..., ge=-90, le=90)
    centroid_lon: float = Field(..., ge=-180, le=180)
    backscatter_vv: float
    area_m2: float = Field(..., ge=0)
    pixel_count: int = Field(..., ge=1)
    is_new_activity: bool = True


class IngestResponse(BaseModel):
    alert_id: str
    confidence_level: int
    sha256: str
    legal_status: str
    indigenous_territory: Optional[str] = None
    notifications_dispatched: bool = False


# ─── Lectura de alertas ────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    created_at: datetime
    scene_id: str
    scene_date_utc: datetime
    centroid_lat: float
    centroid_lon: float
    backscatter_vv: Optional[float] = None
    area_m2: Optional[float] = None
    pixel_count: Optional[int] = None
    confidence_level: Optional[int] = None
    legal_status: Optional[str] = None
    indigenous_territory: Optional[str] = None
    indigenous_nation: Optional[str] = None
    requires_ddhh_protocol: bool = False
    is_new_activity: bool = True
    sha256_evidence: str
    alert_url: Optional[str] = None
    detection_source: str = "Sentinel-1 SAR"
    mistral_context: Optional[str] = None
    impact_metrics: Optional[dict[str, Any]] = None


# ─── Estados de alerta ─────────────────────────────────────────────
class AlertStateUpdate(BaseModel):
    state: str = Field(..., pattern="^(nueva|revisando|en_campo|medida_cautelar|archivado|falso_positivo)$")
    notes: Optional[str] = None


# ─── Organizaciones y destinatarios ────────────────────────────────
class OrganizationIn(BaseModel):
    name: str
    type: str = Field(..., pattern="^(CAR|ONG|FISCALIA|INVESTIGACION)$")
    contact_email: Optional[str] = None
    roi_bounds: Optional[dict[str, float]] = None
    alert_level_threshold: int = 2


class RecipientIn(BaseModel):
    """Alta de un destinatario WhatsApp/SMS.

    Acepta tanto los nombres canónicos (`phone_number`, `basin_ids`,
    `organization_id`) como los alias usados por el frontend antiguo
    (`phone`, `basins`, sin org → se asigna a la organización por defecto).
    """

    phone_number: Optional[str] = Field(default=None, alias="phone")
    organization_id: Optional[str] = None
    basin_ids: list[str] = Field(default_factory=list, alias="basins")
    role: Optional[str] = None

    model_config = {"populate_by_name": True, "extra": "ignore"}
