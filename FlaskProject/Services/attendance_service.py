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

    async def sync_attendance(self, device_data: Dict[str, Any]) -> bool:
        try:
            # Convertir datos del dispositivo al formato de attendance_logs
            log_data = {
                "enrollid": str(device_data.get("enrollid")),
                "timestamp": datetime.now().isoformat(),
                "device_sn": device_data.get("sn", ""),
                "created_at": datetime.now().isoformat(),
                "verificado": 0
            }

            # Nota: supabase-py no es asíncrono, pero lo envolvemos en async
            # para mantener la consistencia de la interfaz
            result = self.supabase.table("attendance_logs").insert(log_data).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error sincronizando log de asistencia: {e}")
            return False