"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer, Transaction, Payment } from "@/lib/types";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/payment-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";

interface CustomerDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCustomerDetails();
  }, [resolvedParams.id]);

  const fetchCustomerDetails = async () => {
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("customer_id", resolvedParams.id)
          .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("customer_id", resolvedParams.id)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Error loading customer data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    const printContent = `
      <html>
        <head>
          <title>Customer Statement - ${customer?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .balance { font-size: 24px; font-weight: bold; color: ${
              (customer?.balance ?? 0) >= 0 ? "green" : "red"
            }; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Statement</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="customer-info">
            <h2>${customer?.name}</h2>
            <p>Email: ${customer?.email || "N/A"}</p>
            <p>Phone: ${customer?.phone || "N/A"}</p>
            <p>Address: ${customer?.address || "N/A"}</p>
            <p class="balance">Current Balance: ₪${customer?.balance.toLocaleString()}</p>
          </div>

          <h3>Recent Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                <tr>
                  <td>${formatDate(transaction.created_at)}</td>
                  <td>${transaction.type}</td>
                  <td>₪${transaction.amount.toLocaleString()}</td>
                  <td>${transaction.description || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <h3>Recent Payments</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${payments
                .map(
                  (payment) => `
                <tr>
                  <td>${formatDate(payment.created_at)}</td>
                  <td>₪${payment.amount.toLocaleString()}</td>
                  <td>${payment.payment_method}</td>
                  <td>${payment.notes || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
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

  // Helper to format date as dd/mm/yyyy
  function formatDate(dateString: string) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!customer) {
    return <div className="text-center py-8">Customer not found</div>;
  }

  function handlePrintPayment(payment: Payment): void {
    const printContent = `
      <html>
        <head>
          <title>Payment Receipt - ${customer?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .receipt { font-size: 18px; margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: green; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .details-table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="customer-info">
            <h2>${customer?.name}</h2>
            <p>Email: ${customer?.email || "N/A"}</p>
            <p>Phone: ${customer?.phone || "N/A"}</p>
            <p>Address: ${customer?.address || "N/A"}</p>
          </div>
          <div class="receipt">
            <p><strong>Payment Date:</strong> ${formatDate(
              payment.created_at
            )}</p>
            <p class="amount">Amount: ₪${payment.amount.toLocaleString()}</p>
            <table class="details-table">
              <tr>
                <th>Payment Method</th>
                <td>${payment.payment_method}</td>
              </tr>
              <tr>
                <th>Notes</th>
                <td>${payment.notes || "-"}</td>
              </tr>
              <tr>
                <th>Receipt ID</th>
                <td>${payment.id}</td>
              </tr>
            </table>
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
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent">
                {customer.name}
              </h1>
              <p className="text-blue-600 dark:text-blue-300">
                Customer Details
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* زر طباعة كشف حساب الزبون (Print Statement) */}
            <Button
              variant="outline"
              onClick={handlePrintInvoice}
              className="border-blue-300 text-blue-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Statement
            </Button>
            {/* زر طباعة الفاتورة (Invoice) سيضاف لاحقًا إذا كان هناك فواتير للزبون */}
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm bg-white/90">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Name:
                </span>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Email:
                </span>
                <p className="font-medium">{customer.email || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Phone:
                </span>
                <p className="font-medium">{customer.phone || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Address:
                </span>
                <p className="font-medium">{customer.address || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/90">
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge
                  variant={customer.balance >= 0 ? "default" : "destructive"}
                  className={`text-lg px-4 py-2 ${
                    customer.balance >= 0
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}
                >
                  ₪{customer.balance.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PaymentDialog
                customerId={customer.id}
                customerName={customer.name}
                onPaymentAdded={fetchCustomerDetails}
                type="payment"
                showProductsList
              />
              <PaymentDialog
                customerId={customer.id}
                customerName={customer.name}
                onPaymentAdded={fetchCustomerDetails}
                type="debt"
                showProductsList
                hidePaymentMethod
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm bg-white/90">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "sale" ? "default" : "secondary"
                        }
                      >
                        {transaction.type === "sale"
                          ? "Sale"
                          : transaction.type === "purchase"
                          ? "Purchase"
                          : transaction.type === "deposit"
                          ? "Deposit"
                          : "Withdrawal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ₪{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.description || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {transactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-blue-500">No transactions recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-sm bg-white/90">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>₪{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintPayment(payment)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {payments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-blue-500">No payments recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
