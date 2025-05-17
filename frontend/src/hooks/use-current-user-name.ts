import { createClient } from '@/lib/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string>('?')

  useEffect(() => {
    const fetchProfileName = async () => {
      const supabase = createClient()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.error(sessionError)
        return
      }

      const userId = sessionData.session.user.id

      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('first_name, last_name')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error(profileError)
        return
      }

      setName(`${profile.first_name} ${profile.last_name}`)
    }

    fetchProfileName()
  }, [])

  return name
}
