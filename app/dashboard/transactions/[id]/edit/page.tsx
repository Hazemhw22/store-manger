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

export default function EditTransactionPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
    customer_id: "",
    invoice_id: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchTransaction()
    }
  }, [params.id])

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").eq("id", params.id).single()

      if (error) throw error

      setFormData({
        type: data.type || "",
        amount: data.amount?.toString() || "",
        description: data.description || "",
        customer_id: data.customer_id || "",
        invoice_id: data.invoice_id || "",
      })
    } catch (error) {
      console.error("Error fetching transaction:", error)
      toast.error("Error loading transaction details")
      router.push("/dashboard/transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type || !formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: formData.type,
          amount: Number.parseFloat(formData.amount),
          description: formData.description || null,
          customer_id: formData.customer_id || null,
          invoice_id: formData.invoice_id || null,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Transaction updated successfully")
      router.push(`/dashboard/transactions/${params.id}`)
    } catch (error: any) {
      console.error("Error updating transaction:", error)
      toast.error(error?.message || "Error updating transaction")
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
          <Link href={`/dashboard/transactions/${params.id}`}>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transaction
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Edit Transaction
            </h1>
            <p className="text-gray-600 text-lg mt-2">Update transaction information</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-orange-800">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold">
                    Transaction Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                    className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-50 border-0 focus:ring-2 focus:ring-orange-500/20 resize-none"
                  placeholder="Transaction description..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Link href={`/dashboard/transactions/${params.id}`}>
                  <Button type="button" variant="outline" className="px-8 bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
