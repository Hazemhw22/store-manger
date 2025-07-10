"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import type { Customer, Invoice } from "@/lib/types"
import { createNotification, NotificationTemplates } from "@/lib/notifications"

export default function NewPaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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
    fetchCustomers()
    fetchInvoices()
  }, [])

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

      const { data, error } = await supabase.from("invoices").select("*").eq("store_id", store.id).neq("status", "paid")
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

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Unauthorized")

      const { data: store } = await supabase.from("stores").select("id").eq("email", user.email).single()
      if (!store) throw new Error("Store not found")

      const amount = Number.parseFloat(formData.amount)

      // Add payment record
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          store_id: store.id,
          amount: amount,
          payment_method: formData.payment_method,
          customer_id: formData.customer_id || null,
          invoice_id: formData.invoice_id || null,
          notes: formData.notes || null,
        },
      ])

      if (paymentError) throw paymentError

      // Add transaction record
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          store_id: store.id,
          customer_id: formData.customer_id || null,
          invoice_id: formData.invoice_id || null,
          type: "deposit",
          amount: amount,
          description: `Payment received - ${formData.payment_method}`,
        },
      ])

      if (transactionError) throw transactionError

      // Update customer balance if customer is selected
      let customerName: string | undefined
      if (formData.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("balance, name")
          .eq("id", formData.customer_id)
          .single()

        if (customer) {
          customerName = customer.name
          const newBalance = customer.balance + amount
          const { error: updateError } = await supabase
            .from("customers")
            .update({ balance: newBalance })
            .eq("id", formData.customer_id)

          if (updateError) throw updateError
        }
      }

      // Create notification
      await createNotification(NotificationTemplates.paymentReceived(amount, customerName))

      toast.success("Payment created successfully")
      router.push("/dashboard/payments")
    } catch (error: any) {
      console.error("Error creating payment:", error)
      toast.error(error?.message || "Error creating payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              New Payment
            </h1>
            <p className="text-gray-600 text-lg mt-2">Record a new payment</p>
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
                <Link href="/dashboard/payments">
                  <Button type="button" variant="outline" className="px-8 bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Payment
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
