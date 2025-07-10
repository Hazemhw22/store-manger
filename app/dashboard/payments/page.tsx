"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Printer,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/lib/types";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!store) return;

      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          customer:customers(name),
          invoice:invoices(invoice_number)
        `
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Error loading payments data");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);

      if (error) throw error;

      setPayments(payments.filter((payment) => payment.id !== id));
      toast.success("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Error deleting payment");
    }
  };

  const handlePrintPayment = (payment: Payment) => {
    const printContent = `
      <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>body { font-family: Arial; margin: 20px; } .header { text-align: center; margin-bottom: 30px; } .info { margin-bottom: 20px; } .amount { font-size: 24px; font-weight: bold; color: green; }</style>
        </head>
        <body>
          <div class="header"><h1>Payment Receipt</h1></div>
          <div class="info">
            <p><b>Customer:</b> ${payment.customer?.name || "-"}</p>
            <p><b>Amount:</b> ₪${payment.amount.toLocaleString()}</p>
            <p><b>Payment Method:</b> ${payment.payment_method}</p>
            <p><b>Date:</b> ${(() => {
              const d = new Date(payment.created_at);
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
            })()}</p>
            <p><b>Notes:</b> ${payment.notes || "-"}</p>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.invoice?.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

    const paymentDate = new Date(payment.created_at);
    const matchesDateFrom = !dateFrom || paymentDate >= new Date(dateFrom);
    const matchesDateTo =
      !dateTo || paymentDate <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Payments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage all payments
            </p>
          </div>
          <Link href="/dashboard/payments/new">
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </Link>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
            <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
              Payment List
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white border-0 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 bg-white border-0 focus:ring-2 focus:ring-teal-500/20"
                placeholder="From date"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 bg-white border-0 focus:ring-2 focus:ring-teal-500/20"
                placeholder="To date"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Payment Method
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Notes
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredPayments.map((payment, index) => (
                      <tr
                        key={payment.id}
                        className={`hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-950 dark:hover:to-cyan-950 transition-all duration-200 ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50/50 dark:bg-gray-750"
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          ₪{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {payment.customer?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {payment.invoice?.invoice_number || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {payment.payment_method}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {payment.notes || "-"}
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-300">
                          {(() => {
                            const d = new Date(payment.created_at);
                            const day = String(d.getDate()).padStart(2, "0");
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const year = d.getFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Link href={`/dashboard/payments/${payment.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/payments/${payment.id}/edit`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-yellow-100 hover:text-yellow-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePayment(payment.id)}
                              className="hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintPayment(payment)}
                              className="hover:bg-green-100 hover:text-green-700"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Print Receipt
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">
                  No payments found matching your search
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
