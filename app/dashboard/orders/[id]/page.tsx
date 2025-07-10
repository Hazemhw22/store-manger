"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Printer, ShoppingCart, Package, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Order, OrderItem } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface OrderDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrderDetails()
  }, [resolvedParams.id])

  const fetchOrderDetails = async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name, email, phone)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", resolvedParams.id)

      if (itemsError) throw itemsError
      setOrderItems(itemsData || [])
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast.error("Error loading order data")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintOrder = () => {
    const printContent = `
      <html>
        <head>
          <title>Order ${order?.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .total { font-size: 24px; font-weight: bold; color: green; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Details</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="order-info">
            <h2>Order ${order?.order_number}</h2>
            <p>Customer: ${order?.customer?.name || "Walk-in Customer"}</p>
            <p>Status: ${order?.status}</p>
            <p>Date: ${new Date(order?.created_at || "").toLocaleDateString()}</p>
            <p class="total">Total Amount: ₪${order?.total_amount.toLocaleString()}</p>
          </div>

          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>₪${item.unit_price.toLocaleString()}</td>
                  <td>₪${item.total_price.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
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
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
        <div className="flex items-center justify-between">
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
                Order {order.order_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Order Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handlePrintOrder}
              className="hover:bg-gray-50 border-gray-300 bg-transparent"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Order
            </Button>
            <Link href={`/dashboard/orders/${order.id}/edit`}>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <ShoppingCart className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Order Number:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{order.order_number}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Customer:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {order.customer?.name || "Walk-in Customer"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Status:</span>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Date:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Package className="h-5 w-5" />
                Order Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <Badge className="text-2xl px-6 py-3 font-bold bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100">
                  ₪{order.total_amount.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-gray-400">{order.notes || "No notes"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {orderItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-750"
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          ₪{item.unit_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          ₪{item.total_price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {orderItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No items in this order</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
