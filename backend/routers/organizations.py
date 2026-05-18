"""CRUD de organizaciones y destinatarios (panel admin de la ONG/CAR)."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from ..database import supabase_client
from ..schemas import OrganizationIn, RecipientIn
from ..services.sha256_chain import hash_phone


logger = logging.getLogger(__name__)
router = APIRouter()


DEFAULT_ORG_NAME = "Operación Freddy Hg"
DEFAULT_ORG_TYPE = "ONG"


def _get_or_create_default_org() -> str:
    """Devuelve el UUID de la organización por defecto, creándola si no existe.

    Pensado para los pilotos donde aún no se han registrado orgs reales
    (la consola debe poder añadir destinatarios sin pedir org primero).
    """
    try:
        existing = (
            supabase_client.table("organizations")
            .select("id")
            .eq("name", DEFAULT_ORG_NAME)
            .limit(1)
            .execute()
        )
        if existing.data:
            return existing.data[0]["id"]
    except Exception:  # noqa: BLE001
        logger.exception("Default org lookup failed")
        raise

    try:
        created = (
            supabase_client.table("organizations")
            .insert(
                {
                    "name": DEFAULT_ORG_NAME,
                    "type": DEFAULT_ORG_TYPE,
                    "contact_email": None,
                    "alert_level_threshold": 1,
                }
            )
            .execute()
        )
        if created.data:
            return created.data[0]["id"]
    except Exception as exc:  # noqa: BLE001
        logger.exception("Default org insert failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    raise HTTPException(status_code=500, detail="No se pudo crear la organización por defecto")


@router.get("/organizations")
def list_organizations() -> dict[str, Any]:
    rows = supabase_client.table("organizations").select("*").order("name").execute().data or []
    return {"count": len(rows), "organizations": rows}


@router.post("/organizations")
def create_organization(payload: OrganizationIn) -> dict[str, Any]:
    try:
        res = supabase_client.table("organizations").insert(payload.model_dump()).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return res.data[0] if res.data else {}


@router.post("/recipients")
def add_recipient(payload: RecipientIn) -> dict[str, Any]:
    """Añade un destinatario; nunca almacena el número en claro (sólo hash + ref).

    - ``organization_id`` es opcional: si no se envía, se usa o crea
      la organización por defecto.
    - Acepta nombres canónicos y alias (`phone`, `basins`).
    """
    if not payload.phone_number:
        raise HTTPException(status_code=422, detail="Falta `phone_number` (o `phone`).")
    if not payload.phone_number.startswith("+") or len(payload.phone_number) < 8:
        raise HTTPException(
            status_code=422,
            detail="El número debe estar en formato internacional (ej: +573153350984).",
        )

    org_id = payload.organization_id or _get_or_create_default_org()
    phone_hash = hash_phone(payload.phone_number)
    last4 = "".join(c for c in payload.phone_number if c.isdigit())[-4:] or "----"

    record: dict[str, Any] = {
        "organization_id": org_id,
        "phone_number_hash": phone_hash,
        "phone_secret_ref": f"vault://twilio/{phone_hash[:16]}",
        "basin_ids": payload.basin_ids,
        "active": True,
    }
    # Campos opcionales (presentes a partir de la migración 003); ignorados
    # silenciosamente por Supabase si la columna no existe gracias a try/fallback.
    optional = {"phone_last4": last4, "role": payload.role}
    try:
        res = supabase_client.table("recipients").insert({**record, **optional}).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Recipient insert with optional cols failed (%s); retry sin extras", exc)
        try:
            res = supabase_client.table("recipients").insert(record).execute()
        except Exception as exc2:  # noqa: BLE001
            logger.exception("Recipient insert failed")
            raise HTTPException(status_code=500, detail=str(exc2)) from exc2

    new_id = res.data[0]["id"] if res.data else None
    return {
        "id": new_id,
        "organization_id": org_id,
        "phone_hash": phone_hash,
        "phone_last4": last4,
        "basin_ids": payload.basin_ids,
        "role": payload.role,
        "active": True,
    }


@router.get("/recipients")
def list_all_recipients(
    organization_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
) -> dict[str, Any]:
    """Lista destinatarios (filtrable por organización; si no se pasa, todos)."""
    q = (
        supabase_client.table("recipients")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if organization_id:
        q = q.eq("organization_id", organization_id)
    try:
        rows = q.execute().data or []
    except Exception as exc:  # noqa: BLE001
        logger.exception("Recipients list query failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    for r in rows:
        r.setdefault("phone_last4", None)
        r.setdefault("role", None)
    return {"count": len(rows), "recipients": rows}


@router.get("/recipients/{organization_id}")
def list_recipients(organization_id: str) -> dict[str, Any]:
    return list_all_recipients(organization_id=organization_id)


@router.delete("/recipients/{recipient_id}")
def delete_recipient(recipient_id: str) -> dict[str, Any]:
    """Borra (desactiva) un destinatario. Lo dejamos como soft-delete (active=false)."""
    try:
        res = (
            supabase_client.table("recipients")
            .update({"active": False})
            .eq("id", recipient_id)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Recipient delete failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not res.data:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado")
    return {"id": recipient_id, "active": False}
