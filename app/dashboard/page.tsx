"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer, Invoice, Transaction, Product } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalSales: 0,
    totalBalance: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>("");
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchStoreName();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();
      if (!store) return;

      // Fetch customers
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      // Fetch invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select(
          `
          *,
          customer:customers(name)
        `
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select(
          `
          *,
          customer:customers(name)
        `
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Calculate stats
      const totalCustomers = customers?.length || 0;
      const totalProducts = products?.length || 0;
      const totalInvoices = invoices?.length || 0;
      const totalRevenue =
        invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
      const totalSales =
        invoices?.filter((inv) => inv.status === "paid").length || 0;
      const totalBalance =
        customers?.reduce((sum, customer) => sum + customer.balance, 0) || 0;

      setStats({
        totalCustomers,
        totalProducts,
        totalInvoices,
        totalRevenue,
        totalSales,
        totalBalance,
      });

      setRecentCustomers(customers?.slice(0, 5) || []);
      setRecentInvoices(invoices?.slice(0, 5) || []);
      setRecentTransactions(transactions || []);
      setRecentProducts(products?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase
        .from("stores")
        .select("name")
        .eq("owner_user_id", user.id)
        .single();
      setStoreName(store?.name || "My Store");
    } catch {
      setStoreName("My Store");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-2xl font-bold">
                      {stats.totalCustomers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +8% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold">{stats.totalSales}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +15% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ₪{stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +23% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Customers */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Customers</CardTitle>
                  <Link href="/dashboard/customers">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-blue-500 text-white text-sm">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {customer.email || "No email"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          customer.balance >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        ₪{customer.balance.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                  {recentCustomers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No customers yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Products */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Products</CardTitle>
                  <Link href="/dashboard/products">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.category || "No category"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₪{product.price.toLocaleString()}
                        </p>
                        <Badge
                          className={
                            product.stock_quantity > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock_quantity > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          Stock: {product.stock_quantity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentProducts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No products yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <div className="flex gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    Recent
                  </Button>
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {transaction.customer?.name
                                  ? getInitials(transaction.customer.name)
                                  : "N/A"}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {transaction.customer?.name || "Unknown Customer"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={
                              transaction.type === "sale"
                                ? "bg-green-100 text-green-800"
                                : transaction.type === "purchase"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-medium">
                          ₪{transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(
                            transaction.created_at
                          ).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-green-100 text-green-800">
                            Complete
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {recentTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent transactions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
