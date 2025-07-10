"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    }
  }

  return <LoadingSpinner />
}
