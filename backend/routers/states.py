"""Workflow de estados de alerta (US-11)."""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from ..database import supabase_client
from ..schemas import AlertStateUpdate


router = APIRouter()


@router.put("/alerts/{alert_id}/state")
def update_state(alert_id: str, payload: AlertStateUpdate, x_user_id: str | None = Header(default=None)):
    """Inserta un nuevo registro de estado (la historia es inmutable)."""
    record = {
        "alert_id": alert_id,
        "state": payload.state,
        "notes": payload.notes,
        "changed_by": x_user_id,
    }
    try:
        res = supabase_client.table("alert_states").insert(record).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    # Auditoria
    supabase_client.table("audit_log").insert(
        {
            "event_type": "state_changed",
            "alert_id": alert_id,
            "event_data": {"state": payload.state, "notes": payload.notes},
        }
    ).execute()
    return res.data[0] if res.data else {}


@router.get("/alerts/{alert_id}/states")
def list_states(alert_id: str):
    rows = (
        supabase_client.table("alert_states")
        .select("*")
        .eq("alert_id", alert_id)
        .order("changed_at", desc=True)
        .execute()
    ).data or []
    return {"count": len(rows), "states": rows}
