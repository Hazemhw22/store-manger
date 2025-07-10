"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import type { Customer, Invoice } from "@/lib/types"

export default function EditPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "cash",
    customer_id: "",
    invoice_id: "",
    notes: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchPayment()
      fetchCustomers()
      fetchInvoices()
    }
  }, [params.id])

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase.from("payments").select("*").eq("id", params.id).single()

      if (error) throw error

      setFormData({
        amount: data.amount?.toString() || "",
        payment_method: data.payment_method || "cash",
        customer_id: data.customer_id || "",
        invoice_id: data.invoice_id || "",
        notes: data.notes || "",
      })
    } catch (error) {
      console.error("Error fetching payment:", error)
      toast.error("Error loading payment details")
      router.push("/dashboard/payments")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase.from("stores").select("id").eq("email", user.email).single()
      if (!store) return

      const { data, error } = await supabase.from("customers").select("*").eq("store_id", store.id)
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase.from("stores").select("id").eq("email", user.email).single()
      if (!store) return

      const { data, error } = await supabase.from("invoices").select("*").eq("store_id", store.id)
      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error("Error fetching invoices:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("payments")
        .update({
          amount: Number.parseFloat(formData.amount),
          payment_method: formData.payment_method,
          customer_id: formData.customer_id || null,
          invoice_id: formData.invoice_id || null,
          notes: formData.notes || null,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Payment updated successfully")
      router.push(`/dashboard/payments/${params.id}`)
    } catch (error: any) {
      console.error("Error updating payment:", error)
      toast.error(error?.message || "Error updating payment")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/payments/${params.id}`}>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payment
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Edit Payment
            </h1>
            <p className="text-gray-600 text-lg mt-2">Update payment information</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-teal-800">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold">
                    Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-sm font-semibold">
                    Payment Method *
                  </Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer_id" className="text-sm font-semibold">
                    Customer (Optional)
                  </Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_id" className="text-sm font-semibold">
                    Invoice (Optional)
                  </Label>
                  <Select
                    value={formData.invoice_id}
                    onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20">
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Invoice</SelectItem>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - ₪{invoice.total_amount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  placeholder="Payment notes..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Link href={`/dashboard/payments/${params.id}`}>
                  <Button type="button" variant="outline" className="px-8 bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
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
