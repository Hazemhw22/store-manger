"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, FileText, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Transaction } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"

export default function TransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTransaction()
    }
  }, [params.id])

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          customer:customers(name, email),
          invoice:invoices(invoice_number)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setTransaction(data)
    } catch (error) {
      console.error("Error fetching transaction:", error)
      toast.error("Error loading transaction details")
      router.push("/dashboard/transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTransaction = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", params.id)

      if (error) throw error

      toast.success("Transaction deleted successfully")
      router.push("/dashboard/transactions")
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Error deleting transaction")
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Sale</Badge>
      case "purchase":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Purchase</Badge>
      case "deposit":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Deposit</Badge>
      case "withdrawal":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Withdrawal</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction not found</h2>
          <Link href="/dashboard/transactions">
            <Button>Back to Transactions</Button>
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
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Transaction Details
              </h1>
              <p className="text-gray-600 text-lg mt-2">View transaction information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              onClick={deleteTransaction}
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
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <FileText className="h-5 w-5" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Transaction Type</Label>
                    <div className="mt-2">{getTypeBadge(transaction.type)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Amount</Label>
                    <p className="text-2xl font-bold text-gray-900 mt-2">₪{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>

                {transaction.description && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Description</Label>
                    <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">{transaction.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Date Created</Label>
                    <p className="text-gray-900 mt-2">{new Date(transaction.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Transaction ID</Label>
                    <p className="text-gray-900 mt-2 font-mono text-sm">{transaction.id}</p>
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
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm text-orange-700">Amount</p>
                    <p className="text-xl font-bold text-orange-900">₪{transaction.amount.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-700">Type</p>
                    <p className="text-lg font-semibold text-blue-900 capitalize">{transaction.type}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {(transaction.customer || transaction.invoice) && (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <User className="h-5 w-5" />
                    Related Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {transaction.customer && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Customer</Label>
                      <p className="text-gray-900 mt-1">{transaction.customer.name}</p>
                      {transaction.customer.email && (
                        <p className="text-gray-600 text-sm">{transaction.customer.email}</p>
                      )}
                    </div>
                  )}

                  {transaction.invoice && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Invoice</Label>
                      <p className="text-gray-900 mt-1">{transaction.invoice.invoice_number}</p>
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
