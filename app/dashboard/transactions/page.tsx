"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/types";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
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
        .from("transactions")
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
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Error loading transactions data");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTransactions(
        transactions.filter((transaction) => transaction.id !== id)
      );
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error deleting transaction");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());

    const transactionDate = new Date(transaction.created_at);
    const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom);
    const matchesDateTo =
      !dateTo || transactionDate <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Sale
          </Badge>
        );
      case "purchase":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Purchase
          </Badge>
        );
      case "deposit":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            Deposit
          </Badge>
        );
      case "withdrawal":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Withdrawal
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage all financial transactions
            </p>
          </div>
          <Link href="/dashboard/transactions/new">
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </Link>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              Transaction List
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white border-0 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 bg-white border-0 focus:ring-2 focus:ring-orange-500/20"
                placeholder="From date"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 bg-white border-0 focus:ring-2 focus:ring-orange-500/20"
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
                        Type
                      </th>
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
                        Description
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
                    {filteredTransactions.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 transition-all duration-200 ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50/50 dark:bg-gray-750"
                        }`}
                      >
                        <td className="px-6 py-4">
                          {getTypeBadge(transaction.type)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          ₪{transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {transaction.customer?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {transaction.invoice?.invoice_number || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-300">
                          {(() => {
                            const d = new Date(transaction.created_at);
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
                            <Link
                              href={`/dashboard/transactions/${transaction.id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/transactions/${transaction.id}/edit`}
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
                              onClick={() => deleteTransaction(transaction.id)}
                              className="hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">
                  No transactions found matching your search
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
