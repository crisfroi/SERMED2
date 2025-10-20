from supabase import create_client
import os
from datetime import datetime
from typing import Dict, Any

class AttendanceService:
    def __init__(self):
        self.supabase = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_KEY", "")
        )

    def sync_attendance(self, device_data: Dict[str, Any]) -> bool:
        try:
            log_data = {
                "enrollid": str(device_data.get("enrollid")),
                "timestamp": datetime.now().isoformat(),
                "device_sn": device_data.get("sn", ""),
                "created_at": datetime.now().isoformat(),
                "verificado": 0
            }

            result = self.supabase.table("attendance_logs").insert(log_data).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error sincronizando log de asistencia: {e}")
            return False