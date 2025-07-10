"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, ShoppingCart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Order, Customer } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface EditOrderPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer_id: "",
    status: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase.from("stores").select("id").eq("email", user.email).single()
      if (!store) return

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", resolvedParams.id)
        .single()

      if (orderError) throw orderError

      setOrder(orderData)
      setFormData({
        customer_id: orderData.customer_id || "walk-in",
        status: orderData.status,
        notes: orderData.notes || "",
      })

      // Fetch customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("name")

      setCustomers(customersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error loading order data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_id: formData.customer_id === "walk-in" ? null : formData.customer_id,
          status: formData.status,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id)

      if (error) throw error

      toast.success("Order updated successfully")
      router.push(`/dashboard/orders/${resolvedParams.id}`)
    } catch (error: any) {
      console.error("Error updating order:", error)
      toast.error(error.message || "Error updating order")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Edit Order
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Update order information</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <ShoppingCart className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Customer
                  </Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Order notes..."
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-6 py-3 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
