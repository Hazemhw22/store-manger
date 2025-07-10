"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Mail, Eye, EyeOff, Lock } from "lucide-react"
import { createNotification, NotificationTemplates } from "@/lib/notifications"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      // Get store name for notification
      const { data: store } = await supabase.from("stores").select("name").eq("email", formData.email).single()
      const storeName = store?.name || "Store"

      // Create login notification
      await createNotification(NotificationTemplates.login(storeName))

      toast.success("Logged in successfully")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Error logging in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-8 h-8 bg-blue-500 rounded-full opacity-60"></div>
      <div className="absolute top-32 right-20 w-6 h-6 bg-green-400 rounded-full opacity-70"></div>
      <div className="absolute bottom-20 left-20 w-10 h-10 bg-purple-400 rounded-full opacity-50"></div>
      <div className="absolute bottom-40 right-10 w-4 h-4 bg-orange-400 rounded-full opacity-60"></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-green-300 rounded-full opacity-40"></div>
      <div className="absolute top-20 right-1/3 w-5 h-5 bg-blue-300 rounded-full opacity-50"></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2">
          {/* Left side - Form */}
          <div className="p-8 lg:p-12">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">Store Manager</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Questions section */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-gray-500 text-sm">Questions?</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                </div>
                <span className="text-blue-600 text-sm font-medium">Ask Support</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="h-12 pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="h-12 pl-10 pr-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>

          {/* Right side - Illustration */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Background stars and elements */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-20 right-20 w-2 h-2 bg-yellow-300 rounded-full opacity-80"></div>
            <div className="absolute bottom-32 left-16 w-1 h-1 bg-white rounded-full opacity-70"></div>
            <div className="absolute top-1/3 right-10 w-1 h-1 bg-green-300 rounded-full opacity-60"></div>
            <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-pink-300 rounded-full opacity-70"></div>

            {/* AI Badge */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-2xl font-bold">HELLO</span>
                <div className="w-6 h-6 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Main illustration area */}
            <div className="relative z-10 text-center">
              {/* Planet with rockets */}
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-green-400 rounded-full mx-auto relative">
                  <div className="absolute inset-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">store manager</span>
                  </div>
                  {/* Rockets */}
                  <div className="absolute -top-4 -left-8 w-16 h-8 bg-gray-200 rounded-full transform -rotate-45"></div>
                  <div className="absolute -bottom-4 -right-8 w-16 h-8 bg-gray-200 rounded-full transform rotate-45"></div>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4">Welcome to your store management</h2>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-8">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              </div>
            </div>

            {/* Figma-like dots */}
            <div className="absolute top-1/4 right-8">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
