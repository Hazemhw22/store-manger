"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import type { Store } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    fetchStoreData()
    setIsPageLoading(false)
  }, [])

  const fetchStoreData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("stores").select("*").eq("email", user.email).single()

      if (error) throw error

      setStore(data)
      setFormData({
        name: data.name,
        email: data.email,
      })
    } catch (error) {
      console.error("Error fetching store data:", error)
      toast.error("Error loading store data")
    }
  }

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          name: formData.name,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id)

      if (error) throw error

      toast.success("Store information updated successfully")
    } catch (error: any) {
      console.error("Error updating store:", error)
      toast.error(error.message || "Error updating store information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      window.location.href = "/login"
    } catch (error: any) {
      console.error("Error logging out:", error)
      toast.error("Error logging out")
    }
  }

  if (isPageLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Manage store settings and account</p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
              <CardTitle className="text-blue-800 dark:text-blue-200">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdateStore} className="space-y-6">
                <div>
                  <Label htmlFor="storeName" className="text-sm font-semibold text-gray-700">
                    Store Name
                  </Label>
                  <Input
                    id="storeName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter store name"
                    className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="storeEmail" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardTitle className="text-purple-800 dark:text-purple-200">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  To change your password, please use the password reset link
                </p>
                <Button variant="outline" className="h-12 hover:bg-purple-50 border-purple-200 bg-transparent">
                  Send Reset Link
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">Log out from your account</p>
                <Button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl hover:shadow-2xl transition-all duration-300 h-12 px-8"
                >
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="text-green-800 dark:text-green-200">Store Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-blue-700 font-medium">Total Customers</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-green-700 font-medium">Total Products</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-purple-700 font-medium">Total Invoices</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">₪0</div>
                  <div className="text-sm text-orange-700 font-medium">Total Sales</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
