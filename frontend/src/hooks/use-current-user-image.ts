import { createClient } from '@/lib/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const supabase = createClient()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.error(sessionError)
        return
      }

      const userId = sessionData.session.user.id

      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('image_url')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error(profileError)
        return
      }

      setImage(profile.image_url)
    }

    fetchUserImage()
  }, [])

  return image
}
