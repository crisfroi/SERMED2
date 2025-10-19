export interface Database {
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          id: number
          enrollid: string
          timestamp: string
          device_sn: string
          created_at: string
          verificado: number
          empleado_id: string | null
        }
        // ...existing code...
      }
    }
  }
}