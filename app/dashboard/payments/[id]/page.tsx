"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, DollarSign, FileText, User, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Payment } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"

export default function PaymentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPayment()
    }
  }, [params.id])

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          customer:customers(name, email),
          invoice:invoices(invoice_number, total_amount)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setPayment(data)
    } catch (error) {
      console.error("Error fetching payment:", error)
      toast.error("Error loading payment details")
      router.push("/dashboard/payments")
    } finally {
      setIsLoading(false)
    }
  }

  const deletePayment = async () => {
    if (!confirm("Are you sure you want to delete this payment?")) return

    try {
      const { error } = await supabase.from("payments").delete().eq("id", params.id)

      if (error) throw error

      toast.success("Payment deleted successfully")
      router.push("/dashboard/payments")
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("Error deleting payment")
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment not found</h2>
          <Link href="/dashboard/payments">
            <Button>Back to Payments</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/payments">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Payment Details
              </h1>
              <p className="text-gray-600 text-lg mt-2">View payment information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/payments/${payment.id}/edit`}>
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              onClick={deletePayment}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-teal-800">
                  <FileText className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Amount</Label>
                    <p className="text-3xl font-bold text-teal-600 mt-2">₪{payment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Payment Method</Label>
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                {payment.notes && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Notes</Label>
                    <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">{payment.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Date Created</Label>
                    <p className="text-gray-900 mt-2">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Payment ID</Label>
                    <p className="text-gray-900 mt-2 font-mono text-sm">{payment.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <DollarSign className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                  <div>
                    <p className="text-sm text-teal-700">Amount</p>
                    <p className="text-xl font-bold text-teal-900">₪{payment.amount.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-teal-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-700">Method</p>
                    <p className="text-lg font-semibold text-blue-900 capitalize">
                      {payment.payment_method.replace("_", " ")}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {(payment.customer || payment.invoice) && (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <User className="h-5 w-5" />
                    Related Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {payment.customer && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Customer</Label>
                      <p className="text-gray-900 mt-1">{payment.customer.name}</p>
                      {payment.customer.email && <p className="text-gray-600 text-sm">{payment.customer.email}</p>}
                    </div>
                  )}

                  {payment.invoice && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Invoice</Label>
                      <p className="text-gray-900 mt-1">{payment.invoice.invoice_number}</p>
                      <p className="text-gray-600 text-sm">₪{payment.invoice.total_amount.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
