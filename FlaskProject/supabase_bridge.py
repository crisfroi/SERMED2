import os
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests
from urllib.parse import quote_plus

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
    """Find or create device. Prefer tm_no if supported; fallback to name-only."""
    h = _headers()
    name = f"Terminal {tm_no or serial or 'unknown'}"
    # Try GET by tm_no if column exists
    if tm_no:
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/dispositivos?select=id&tm_no=eq.{tm_no}&limit=1",
                headers=h,
                timeout=10,
            )
            if r.ok:
                data = r.json()
                if isinstance(data, list) and data:
                    return data[0]["id"]
        except requests.RequestException:
            pass
    # Try GET by nombre as fallback (best-effort)
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/dispositivos?select=id&nombre=eq.{quote_plus(name)}&limit=1",
            headers=h,
            timeout=10,
        )
        if r.ok:
            data = r.json()
            if isinstance(data, list) and data:
                return data[0]["id"]
    except requests.RequestException:
        pass
    # Create device. First attempt with tm_no; on 400 retry without tm_no
    payload = {"nombre": name, "activo": True}
    if tm_no:
        payload["tm_no"] = tm_no
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/dispositivos",
            headers=_headers({"Prefer": "return=representation"}),
            data=json.dumps(payload),
            timeout=10,
        )
        r.raise_for_status()
        return r.json()[0]["id"]
    except requests.HTTPError:
        # Retry without tm_no in case column doesn't exist
        if "tm_no" in payload:
            payload.pop("tm_no", None)
            r2 = requests.post(
                f"{SUPABASE_URL}/rest/v1/dispositivos",
                headers=_headers({"Prefer": "return=representation"}),
                data=json.dumps(payload),
                timeout=10,
            )
            r2.raise_for_status()
            return r2.json()[0]["id"]
        raise


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
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/attendance_logs?on_conflict=id_dispositivo,en_no,fecha_hora",
            headers=_headers({"Prefer": "return=minimal, resolution=merge-duplicates"}),
            data=json.dumps(prepared),
            timeout=20,
        )
        r.raise_for_status()
    except requests.HTTPError:
        # Retry without tm_no field if schema doesn't support it
        stripped = []
        for row in prepared:
            row2 = dict(row)
            row2.pop("tm_no", None)
            stripped.append(row2)
        r2 = requests.post(
            f"{SUPABASE_URL}/rest/v1/attendance_logs?on_conflict=id_dispositivo,en_no,fecha_hora",
            headers=_headers({"Prefer": "return=minimal, resolution=merge-duplicates"}),
            data=json.dumps(stripped),
            timeout=20,
        )
        r2.raise_for_status()

    # Mark device as seen
    update_device_last_seen(device_id)
