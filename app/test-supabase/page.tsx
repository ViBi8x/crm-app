'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestSupabasePage() {
  useEffect(() => {
    const fetchAppConfig = async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
      console.log('DATA:', data)
      console.log('ERROR:', error)
    }
    fetchAppConfig()
  }, [])

  return <div>Test Supabase (xem kết quả ở Console log của trình duyệt)</div>
}
