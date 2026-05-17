"""Router de ingesta: recibe detecciones crudas del pipeline GEE."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from ..config import settings
from ..database import supabase_client
from ..schemas import IngestResponse, RawAlertPayload
from ..services.geofence import check_concession_status, check_indigenous_territory
from ..services.mistral_enrichment import enrich_alert
from ..services.notifications import dispatch_alert_notifications
from ..services.sha256_chain import compute_evidence_hash


logger = logging.getLogger(__name__)
router = APIRouter()


def _compute_confidence(legal_status: str, requires_ddhh: bool, is_new: bool) -> int:
    """Calcula el nivel de confianza 1/2/3 segun F-09."""
    if requires_ddhh:
        return 3
    if legal_status == "ilegal_presunto":
        return 2
    if is_new:
        return 2
    return 1


@router.post("/ingest", response_model=IngestResponse)
async def ingest_alert(
    payload: RawAlertPayload,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
) -> IngestResponse:
    """Ingesta una deteccion cruda, enriquece, persiste y dispara notificaciones."""
    # Autenticacion simple via SECRET_KEY (Make.com pasa el header)
    expected = f"Bearer {settings.SECRET_KEY}"
    if authorization and authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid authorization token")

    # 1. Geofencing legal + territorial
    concession = await check_concession_status(payload.centroid_lat, payload.centroid_lon)
    territory = check_indigenous_territory(payload.centroid_lat, payload.centroid_lon)

    # 2. Confianza
    confidence = _compute_confidence(
        legal_status=concession["legal_status"],
        requires_ddhh=territory["requires_ddhh_protocol"],
        is_new=payload.is_new_activity,
    )

    # 3. Cadena de custodia
    sha256 = compute_evidence_hash(payload.model_dump(), payload.scene_id, payload.scene_date_utc)

    # 4. Persistir
    alert_id = str(uuid.uuid4())
    alert_url = f"{settings.FRONTEND_URL.rstrip('/')}/alert/{alert_id}"

    record: dict[str, Any] = {
        "id": alert_id,
        "scene_id": payload.scene_id,
        "scene_date_utc": payload.scene_date_utc,
        "centroid_lat": payload.centroid_lat,
        "centroid_lon": payload.centroid_lon,
        "backscatter_vv": payload.backscatter_vv,
        "area_m2": payload.area_m2,
        "pixel_count": payload.pixel_count,
        "is_new_activity": payload.is_new_activity,
        "confidence_level": confidence,
        "legal_status": concession["legal_status"],
        "concession_id": concession.get("concession_id"),
        "indigenous_territory": territory.get("indigenous_territory"),
        "indigenous_nation": territory.get("indigenous_nation"),
        "requires_ddhh_protocol": territory["requires_ddhh_protocol"],
        "sha256_evidence": sha256,
        "alert_url": alert_url,
        "detection_source": "Sentinel-1 SAR GRD",
    }

    # 5. Enriquecimiento Mistral (best-effort, in-process; rapido)
    enrichment = enrich_alert(record)
    if enrichment:
        record.update(enrichment)
        record["enriched_at"] = datetime.utcnow().isoformat() + "Z"

    try:
        supabase_client.table("alerts").insert(record).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to insert alert into Supabase")
        raise HTTPException(status_code=500, detail=f"Database insert failed: {exc}") from exc

    # 6. Auditoria
    try:
        supabase_client.table("audit_log").insert(
            {
                "event_type": "alert_created",
                "alert_id": alert_id,
                "event_data": {
                    "confidence_level": confidence,
                    "legal_status": concession["legal_status"],
                    "sha256": sha256,
                },
            }
        ).execute()
    except Exception:  # noqa: BLE001
        logger.warning("Audit log insert failed")

    # 7. Notificaciones en background
    background_tasks.add_task(dispatch_alert_notifications, record)

    return IngestResponse(
        alert_id=alert_id,
        confidence_level=confidence,
        sha256=sha256,
        legal_status=concession["legal_status"],
        indigenous_territory=territory.get("indigenous_territory"),
        notifications_dispatched=True,
    )
