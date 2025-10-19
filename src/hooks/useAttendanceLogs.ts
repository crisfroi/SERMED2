import { useCallback, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Database } from '../types/database.types'

type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']

export const useAttendanceLogs = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setLogs(data)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { logs, loading, fetchLogs }
}