"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    monthlyRevenue: [] as { month: string; revenue: number }[],
    topProducts: [] as { name: string; sales: number; revenue: number }[],
    customerGrowth: 0,
    revenueGrowth: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase.from("stores").select("id").eq("email", user.email).single()
      if (!store) return

      // Fetch basic stats
      const { data: customers } = await supabase.from("customers").select("*").eq("store_id", store.id)
      const { data: products } = await supabase.from("products").select("*").eq("store_id", store.id)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "paid")

      // Calculate revenue by month (last 6 months)
      const monthlyData = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const monthRevenue =
          invoices
            ?.filter((inv) => {
              const invDate = new Date(inv.created_at)
              return invDate >= monthStart && invDate <= monthEnd
            })
            .reduce((sum, inv) => sum + inv.total_amount, 0) || 0

        monthlyData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthRevenue,
        })
      }

      // Calculate growth rates (comparing last month to previous month)
      const lastMonth = monthlyData[monthlyData.length - 1]?.revenue || 0
      const previousMonth = monthlyData[monthlyData.length - 2]?.revenue || 0
      const revenueGrowth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0

      // Customer growth (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

      const recentCustomers = customers?.filter((c) => new Date(c.created_at) >= thirtyDaysAgo).length || 0
      const previousCustomers =
        customers?.filter((c) => {
          const date = new Date(c.created_at)
          return date >= sixtyDaysAgo && date < thirtyDaysAgo
        }).length || 0

      const customerGrowth =
        previousCustomers > 0 ? ((recentCustomers - previousCustomers) / previousCustomers) * 100 : 0

      setAnalytics({
        totalRevenue: invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0,
        totalCustomers: customers?.length || 0,
        totalProducts: products?.length || 0,
        totalOrders: invoices?.length || 0,
        monthlyRevenue: monthlyData,
        topProducts: [], // Would need invoice_items join for this
        customerGrowth,
        revenueGrowth,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Error loading analytics data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const maxRevenue = Math.max(...analytics.monthlyRevenue.map((m) => m.revenue))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Track your store performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={selectedPeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("week")}
              className={
                selectedPeriod === "week"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "hover:bg-indigo-50"
              }
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("month")}
              className={
                selectedPeriod === "month"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "hover:bg-indigo-50"
              }
            >
              Month
            </Button>
            <Button
              variant={selectedPeriod === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("year")}
              className={
                selectedPeriod === "year"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "hover:bg-indigo-50"
              }
            >
              Year
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₪{analytics.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.revenueGrowth >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs ${analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {Math.abs(analytics.revenueGrowth).toFixed(1)}% from last month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.customerGrowth >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs ${analytics.customerGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {Math.abs(analytics.customerGrowth).toFixed(1)}% from last month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
                  <p className="text-xs text-gray-500 mt-1">Active inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                <Calendar className="h-5 w-5" />
                Revenue Trend (Last 6 Months)
              </CardTitle>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Monthly View
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-80 flex items-end justify-between gap-4">
              {analytics.monthlyRevenue.map((data, index) => {
                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1">
                    <div className="relative w-full flex items-end justify-center" style={{ height: "250px" }}>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-indigo-600 hover:to-purple-500 cursor-pointer relative group"
                        style={{ height: `${height}%`, minHeight: data.revenue > 0 ? "20px" : "0px" }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₪{data.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{data.month}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">Hover over bars to see exact values</div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="text-green-800 dark:text-green-200">Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Revenue Growth</p>
                    <p className="text-sm text-green-700">Strong performance this month</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">+{analytics.revenueGrowth.toFixed(1)}%</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Customer Base</p>
                    <p className="text-sm text-blue-700">Steady customer acquisition</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{analytics.totalCustomers} total</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900">Product Catalog</p>
                    <p className="text-sm text-purple-700">Diverse product range</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">{analytics.totalProducts} items</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
              <CardTitle className="text-orange-800 dark:text-orange-200">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-8">
              <Button
                className="w-full justify-start h-12 bg-transparent hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-green-200"
                variant="outline"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Export Revenue Report
              </Button>
              <Button
                className="w-full justify-start h-12 bg-transparent hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-blue-200"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Customer Analysis
              </Button>
              <Button
                className="w-full justify-start h-12 bg-transparent hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-200"
                variant="outline"
              >
                <Package className="mr-2 h-4 w-4" />
                Inventory Report
              </Button>
              <Button
                className="w-full justify-start h-12 bg-transparent hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 border-orange-200"
                variant="outline"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sales Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
