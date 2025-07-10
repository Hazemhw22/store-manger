"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/types";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
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
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Error loading customers data");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) throw error;

      setCustomers(customers.filter((customer) => customer.id !== id));
      toast.success("Customer deleted successfully");
      // عند حذف أو إضافة زبون أو بعد أي عملية دفع/دين، استدعي fetchCustomers ليتم تحديث الرصيد في الجدول.
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Error deleting customer");
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-blue-950 p-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent dark:from-blue-300 dark:to-blue-200">
              Customers
            </h1>
            <p className="text-blue-600 dark:text-blue-300 text-lg mt-2">
              Manage your customer list
            </p>
          </div>
          <Link href="/dashboard/customers/new">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 dark:from-blue-700 dark:to-blue-800">
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </Link>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl dark:bg-blue-900/90">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              Customer List
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white border-0 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Balance
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Date Added
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700 dark:text-blue-200 border-b border-blue-200 dark:border-blue-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 dark:divide-blue-700">
                    {filteredCustomers.map((customer, idx) => (
                      <tr
                        key={customer.id}
                        className={
                          idx % 2 === 0
                            ? "bg-white dark:bg-blue-950"
                            : "bg-blue-50/50 dark:bg-blue-900"
                        }
                      >
                        <td className="px-6 py-4 font-semibold text-blue-900 dark:text-blue-100">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-900 dark:text-blue-100">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-300">
                          {customer.email || "-"}
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-300">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={
                              customer.balance >= 0
                                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                            }
                          >
                            ₪{customer.balance.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-300">
                          {(() => {
                            const d = new Date(customer.created_at);
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
                            <Link href={`/dashboard/customers/${customer.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200 transition-all duration-200"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/customers/${customer.id}/edit`}
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
                              onClick={() => deleteCustomer(customer.id)}
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

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-blue-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <p className="text-blue-500 text-lg">
                  No customers found matching your search
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
