"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Invoice, Customer } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface EditInvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_number: "",
    total_amount: 0,
    paid_amount: 0,
    status: "",
    due_date: "",
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

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", resolvedParams.id)
        .single()

      if (invoiceError) throw invoiceError

      setInvoice(invoiceData)
      setFormData({
        customer_id: invoiceData.customer_id || "walk-in",
        invoice_number: invoiceData.invoice_number,
        total_amount: invoiceData.total_amount,
        paid_amount: invoiceData.paid_amount,
        status: invoiceData.status,
        due_date: invoiceData.due_date || "",
        notes: invoiceData.notes || "",
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
      toast.error("Error loading invoice data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          customer_id: formData.customer_id || null,
          invoice_number: formData.invoice_number,
          total_amount: formData.total_amount,
          paid_amount: formData.paid_amount,
          status: formData.status,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id)

      if (error) throw error

      toast.success("Invoice updated successfully")
      router.push(`/dashboard/invoices/${resolvedParams.id}`)
    } catch (error: any) {
      console.error("Error updating invoice:", error)
      toast.error(error.message || "Error updating invoice")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!invoice) {
    return <div className="text-center py-8">Invoice not found</div>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Edit Invoice
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Update invoice information</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <FileText className="h-5 w-5" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Invoice Number *
                  </Label>
                  <Input
                    id="invoice_number"
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    placeholder="Enter invoice number"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Customer
                  </Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20">
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
                  <Label htmlFor="total_amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total Amount *
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paid_amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Paid Amount
                  </Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
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
                  placeholder="Invoice notes..."
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20 resize-none"
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
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3"
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
