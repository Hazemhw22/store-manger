"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, FileText, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/types";
import { toast } from "sonner";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "default",
    invoice_number: `INV-${Date.now()}`,
    total_amount: 0,
    paid_amount: 0,
    status: "pending",
    due_date: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (formData.customer_id && formData.customer_id !== "default") {
      const customer = customers.find((c) => c.id === formData.customer_id);
      setSelectedCustomer(customer || null);
      setCustomerInvoices(
        invoices.filter((inv) => inv.customer_id === formData.customer_id)
      );
    } else {
      setSelectedCustomer(null);
      setCustomerInvoices([]);
    }
  }, [formData.customer_id, customers, invoices]);

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

      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("name");

      setCustomers(customersData || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Error loading customers");
    }
  };

  const fetchInvoices = async () => {
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

      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Error loading invoices");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("email", user.email)
        .single();
      if (!store) throw new Error("Store not found");

      const { error } = await supabase.from("invoices").insert([
        {
          store_id: store.id,
          customer_id:
            formData.customer_id === "default" ? null : formData.customer_id,
          invoice_number: formData.invoice_number,
          total_amount: formData.total_amount,
          paid_amount: formData.paid_amount,
          status: formData.status,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
        },
      ]);

      if (error) throw error;

      // Create notification
      await createNotification(
        NotificationTemplates.invoiceCreated(
          formData.invoice_number,
          formData.total_amount
        )
      );

      toast.success("Invoice created successfully");
      fetchInvoices();
      router.push("/dashboard/invoices");
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Error creating invoice");
    } finally {
      setIsLoading(false);
    }
  };

  function formatDate(dateString: string) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function handlePrintInvoice(invoice: any) {
    const printContent = `
      <html>
        <head>
          <title>Invoice #${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: #4f46e5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <p>Invoice #: ${invoice.invoice_number}</p>
            <p>Date: ${formatDate(invoice.created_at)}</p>
          </div>
          <div class="info">
            <h2>Customer: ${selectedCustomer?.name || "Walk-in Customer"}</h2>
            <p>Email: ${selectedCustomer?.email || "-"}</p>
            <p>Phone: ${selectedCustomer?.phone || "-"}</p>
            <p>Address: ${selectedCustomer?.address || "-"}</p>
          </div>
          <div class="amount">
            Total Amount: ₪${invoice.total_amount.toLocaleString()}<br/>
            Paid: ₪${invoice.paid_amount.toLocaleString()}<br/>
            Status: ${invoice.status}
          </div>
          <div>
            <p>Due Date: ${formatDate(invoice.due_date)}</p>
            <p>Notes: ${invoice.notes || "-"}</p>
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
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-8">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create New Invoice
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Add a new invoice
            </p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <FileText className="h-5 w-5" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="invoice_number"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Invoice Number *
                  </Label>
                  <Input
                    id="invoice_number"
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                    placeholder="Enter invoice number"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="customer"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Customer
                  </Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customer_id: value })
                    }
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer && (
                    <div className="mt-2 text-sm text-purple-700 bg-purple-50 rounded p-2">
                      <div>
                        <b>Balance:</b> ₪
                        {selectedCustomer.balance?.toLocaleString() ?? 0}
                      </div>
                      <div>
                        <b>Email:</b> {selectedCustomer.email || "-"}
                      </div>
                      <div>
                        <b>Phone:</b> {selectedCustomer.phone || "-"}
                      </div>
                      <div>
                        <b>Address:</b> {selectedCustomer.address || "-"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="total_amount"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Total Amount *
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="paid_amount"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Paid Amount
                  </Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paid_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paid_amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="due_date"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Invoice notes..."
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-6 py-3 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Create Invoice
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* قائمة فواتير الزبون المختار */}
        {selectedCustomer && customerInvoices.length > 0 && (
          <Card className="bg-white/90 border-0 shadow-xl mt-8">
            <CardHeader>
              <CardTitle className="text-purple-700">
                Invoices for {selectedCustomer.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Print</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInvoices.map((invoice, idx) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell>
                        ₪{invoice.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₪{invoice.paid_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{invoice.status}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>{invoice.notes || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(invoice)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
