"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Printer, FileText, CreditCard, Users, Calendar, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Invoice } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface InvoiceDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchInvoiceDetails()
  }, [resolvedParams.id])

  const fetchInvoiceDetails = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, email, phone, address)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (invoiceError) throw invoiceError
      setInvoice(invoiceData)
    } catch (error) {
      console.error("Error fetching invoice details:", error)
      toast.error("Error loading invoice data")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintInvoice = () => {
    const printContent = `
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #667eea;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #667eea;
              font-size: 2.5em;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .invoice-info { 
              margin-bottom: 30px; 
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              padding: 25px;
              border-radius: 10px;
            }
            .total { 
              font-size: 28px; 
              font-weight: bold; 
              color: #27ae60;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .status { 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold;
              display: inline-block;
              margin: 10px 0;
            }
            .paid { background: linear-gradient(135deg, #d4edda, #c3e6cb); color: #155724; }
            .pending { background: linear-gradient(135deg, #fff3cd, #ffeaa7); color: #856404; }
            .cancelled { background: linear-gradient(135deg, #f8d7da, #f5c6cb); color: #721c24; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            .info-label {
              font-weight: bold;
              color: #667eea;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Invoice</h1>
              <p style="color: #666; font-size: 1.1em;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="invoice-info">
              <h2 style="color: #667eea; margin-bottom: 20px;">Invoice ${invoice?.invoice_number}</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Customer:</div>
                  <div>${invoice?.customer?.name || "Walk-in Customer"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email:</div>
                  <div>${invoice?.customer?.email || "N/A"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone:</div>
                  <div>${invoice?.customer?.phone || "N/A"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Address:</div>
                  <div>${invoice?.customer?.address || "N/A"}</div>
                </div>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <div class="status ${invoice?.status}">${invoice?.status?.toUpperCase()}</div>
              </div>
              <div style="text-align: center;">
                <div class="info-label">Due Date:</div>
                <div style="font-size: 1.2em;">${invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</div>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <div class="total">Total Amount: ₪${invoice?.total_amount.toLocaleString()}</div>
                <div style="font-size: 1.2em; margin: 10px 0;">Paid Amount: ₪${invoice?.paid_amount.toLocaleString()}</div>
                <div style="font-size: 1.2em; color: ${((invoice?.total_amount || 0) - (invoice?.paid_amount || 0)) > 0 ? "#e74c3c" : "#27ae60"};">
                  Balance: ₪${((invoice?.total_amount || 0) - (invoice?.paid_amount || 0)).toLocaleString()}
                </div>
              </div>
            </div>

            ${
              invoice?.notes
                ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">📝 Notes</h3>
                <p style="line-height: 1.6;">${invoice.notes}</p>
              </div>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 px-4 py-2 text-sm font-bold">
            ✅ Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-300 px-4 py-2 text-sm font-bold">
            ⏳ Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300 px-4 py-2 text-sm font-bold">
            ❌ Cancelled
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600">Invoice not found</h2>
          <p className="text-gray-500 mt-2">The invoice you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const balance = invoice.total_amount - invoice.paid_amount

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center hover:bg-white/50 transition-all duration-200 rounded-full p-3"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                📄 Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 text-lg mt-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created on {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handlePrintInvoice}
              className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border-gray-300 bg-white/80 backdrop-blur-sm"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Invoice Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">👤 Name:</span>
                  <p className="font-semibold text-gray-900">{invoice.customer?.name || "Walk-in Customer"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">📧 Email:</span>
                  <p className="font-semibold text-gray-900">{invoice.customer?.email || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">📞 Phone:</span>
                  <p className="font-semibold text-gray-900">{invoice.customer?.phone || "-"}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 font-medium">📍 Address:</span>
                  <p className="font-semibold text-gray-900">{invoice.customer?.address || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Amount:
                  </span>
                  <p className="font-bold text-gray-900 text-xl">₪{invoice.total_amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Paid Amount:</span>
                  <p className="font-semibold text-gray-900">₪{invoice.paid_amount.toLocaleString()}</p>
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    balance > 0
                      ? "bg-gradient-to-r from-red-50 to-pink-50"
                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                  }`}
                >
                  <span className="text-sm text-gray-600 font-medium">Balance:</span>
                  <p className={`font-bold text-xl ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₪{balance.toLocaleString()}
                  </p>
                </div>
                <div className="text-center pt-2">{getStatusBadge(invoice.status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">🔢 Invoice Number:</span>
                  <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">📅 Date Created:</span>
                  <p className="font-semibold text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">⏰ Due Date:</span>
                  <p className="font-semibold text-gray-900">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "No due date"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 font-medium">📝 Notes:</span>
                  <p className="font-semibold text-gray-900">{invoice.notes || "No notes"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
