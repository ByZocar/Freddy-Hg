"""CRUD de organizaciones y destinatarios (panel admin de la ONG/CAR)."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from ..database import supabase_client
from ..schemas import OrganizationIn, RecipientIn
from ..services.sha256_chain import hash_phone


logger = logging.getLogger(__name__)
router = APIRouter()


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
    """Anade un destinatario; nunca almacena el numero en claro (solo hash + ref)."""
    phone_hash = hash_phone(payload.phone_number)
    record = {
        "organization_id": payload.organization_id,
        "phone_number_hash": phone_hash,
        "phone_secret_ref": f"vault://twilio/{phone_hash[:16]}",
        "basin_ids": payload.basin_ids,
        "active": True,
    }
    try:
        res = supabase_client.table("recipients").insert(record).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"id": res.data[0]["id"] if res.data else None, "phone_hash": phone_hash}


@router.get("/recipients/{organization_id}")
def list_recipients(organization_id: str) -> dict[str, Any]:
    rows = (
        supabase_client.table("recipients")
        .select("id, phone_number_hash, basin_ids, active, created_at")
        .eq("organization_id", organization_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []
    return {"count": len(rows), "recipients": rows}
