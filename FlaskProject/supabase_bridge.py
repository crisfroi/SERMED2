import os
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL environment variable is required")
if not SERVICE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_KEY environment variable is required")


def _headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def _normalize_enno(value: Optional[Any]) -> Optional[str]:
    if value is None:
        return None
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    return digits[:10] or None


def _to_iso(dt: Optional[str]) -> str:
    if not dt:
        return datetime.now(timezone.utc).isoformat()
    try:
        # permit formats like "YYYY-MM-DD HH:MM:SS"
        return (
            datetime.fromisoformat(str(dt).replace(" ", "T"))
            .astimezone(timezone.utc)
            .isoformat()
        )
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def resolve_device_id_by_tmno(tm_no: Optional[str], serial: Optional[str] = None) -> str:
    """Find or create device by tm_no (SN) and return its id."""
    h = _headers()
    if tm_no:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/dispositivos?select=id&tm_no=eq.{tm_no}&limit=1",
            headers=h,
            timeout=10,
        )
        if r.ok and isinstance(r.json(), list) and r.json():
            return r.json()[0]["id"]
    # Create device if not found
    payload = {
        "nombre": f"Terminal {tm_no or serial or 'unknown'}",
        "activo": True,
        "tm_no": tm_no,
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/dispositivos",
        headers=_headers({"Prefer": "return=representation"}),
        data=json.dumps(payload),
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    return data[0]["id"]


def update_device_last_seen(device_id: str) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/dispositivos?id=eq.{device_id}",
        headers=_headers({"Prefer": "return=minimal"}),
        data=json.dumps({"last_seen_at": now_iso}),
        timeout=10,
    )


def fetch_prof_mapping(device_id: str, en_nos: List[str]) -> Dict[str, str]:
    if not en_nos:
        return {}
    # Build IN filter for PostgREST
    en_list = ",".join(f'"{e}"' for e in en_nos)
    url = (
        f"{SUPABASE_URL}/rest/v1/empleado_dispositivo_map"
        f"?select=id_profesional,en_no&id_dispositivo=eq.{device_id}&en_no=in.({en_list})"
    )
    r = requests.get(url, headers=_headers(), timeout=10)
    r.raise_for_status()
    rows = r.json()
    return {row["en_no"]: row["id_profesional"] for row in rows}


def push_attendance_batch(sn: str, records: List[Dict[str, Any]]) -> None:
    """Push a batch of attendance records to Supabase."""
    device_id = resolve_device_id_by_tmno(str(sn) if sn is not None else None, str(sn) if sn is not None else None)

    prepared: List[Dict[str, Any]] = []
    en_set: set[str] = set()

    for rec in records:
        en_no = _normalize_enno(rec.get("enroll_id"))
        if en_no:
            en_set.add(en_no)
        inout_raw = rec.get("intOut")
        inout: Optional[str] = None
        if isinstance(inout_raw, str):
            s = inout_raw.upper()
            if s in ("IN", "I"):
                inout = "IN"
            elif s in ("OUT", "O"):
                inout = "OUT"
        elif isinstance(inout_raw, (int, float)):
            # Vendor sometimes uses 0/1 without semantics
            inout = None

        prepared.append(
            {
                "id_dispositivo": device_id,
                "en_no": en_no,
                "tm_no": str(sn) if sn is not None else None,
                "inout": inout,
                "mode": rec.get("mode"),
                "fecha_hora": _to_iso(rec.get("records_time") or rec.get("time")),
                "raw_line": json.dumps(rec),
                "source_file": None,
            }
        )

    # Map id_profesional where available
    en_map = fetch_prof_mapping(device_id, list(en_set))
    for row in prepared:
        if row.get("en_no") and row["en_no"] in en_map:
            row["id_profesional"] = en_map[row["en_no"]]

    # Insert with conflict resolution to avoid duplicates on reconnects
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/attendance_logs?on_conflict=id_dispositivo,en_no,fecha_hora",
        headers=_headers({"Prefer": "return=minimal, resolution=merge-duplicates"}),
        data=json.dumps(prepared),
        timeout=20,
    )
    r.raise_for_status()

    # Mark device as seen
    update_device_last_seen(device_id)
