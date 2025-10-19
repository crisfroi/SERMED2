export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: number
          employee_id: string
          check_in: string
          check_out: string | null
          created_at: string
        }
        // ...existing code...
      }
    }
  }
}