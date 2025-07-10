"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Plus,
  Minus,
  DollarSign,
  Package,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import Link from "next/link";

interface PaymentDialogProps {
  customerId: string;
  customerName: string;
  onPaymentAdded: () => void;
  type: "payment" | "debt";
  showProductsList?: boolean;
  hidePaymentMethod?: boolean;
}

export function PaymentDialog({
  customerId,
  customerName,
  onPaymentAdded,
  type,
  showProductsList = false,
  hidePaymentMethod = false,
}: PaymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "cash",
    notes: "",
    products: "",
    description: "",
  });

  const handleSubmit = async () => {
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

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

      const amount = Number.parseFloat(formData.amount);

      // Get current customer balance
      const { data: customer } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customerId)
        .single();

      if (!customer) throw new Error("Customer not found");

      // Calculate new balance
      const newBalance =
        type === "payment"
          ? customer.balance + amount
          : customer.balance - amount;

      // Update customer balance
      const { error: updateError } = await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("id", customerId);

      if (updateError) throw updateError;

      // Create detailed notes
      const detailedNotes = [
        formData.description && `Description: ${formData.description}`,
        formData.products && `Products/Items: ${formData.products}`,
        formData.notes && `Notes: ${formData.notes}`,
      ]
        .filter(Boolean)
        .join(" | ");

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          store_id: store.id,
          customer_id: customerId,
          amount: type === "payment" ? amount : -amount,
          payment_method: formData.payment_method,
          notes: detailedNotes || null,
        },
      ]);

      if (paymentError) throw paymentError;

      // Create transaction record
      const transactionDescription = [
        type === "payment" ? "Payment received" : "Debt added",
        `from ${customerName}`,
        formData.products && `for ${formData.products}`,
        formData.description && `(${formData.description})`,
      ]
        .filter(Boolean)
        .join(" ");

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            store_id: store.id,
            customer_id: customerId,
            type: type === "payment" ? "deposit" : "withdrawal",
            amount: amount,
            description: transactionDescription,
          },
        ]);

      if (transactionError) throw transactionError;

      // Create notification
      if (type === "payment") {
        await createNotification(
          NotificationTemplates.paymentReceived(amount, customerName)
        );
      } else {
        await createNotification(
          NotificationTemplates.debtAdded(amount, customerName)
        );
      }

      toast.success(
        `${type === "payment" ? "Payment" : "Debt"} recorded successfully`
      );
      setFormData({
        amount: "",
        payment_method: "cash",
        notes: "",
        products: "",
        description: "",
      });
      setIsOpen(false);
      onPaymentAdded();
    } catch (error: any) {
      console.error(`Error adding ${type}:`, error);
      toast.error(error?.message || `Error adding ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      payment_method: "cash",
      notes: "",
      products: "",
      description: "",
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={`w-full ${
            type === "payment"
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          } text-white shadow-lg hover:shadow-xl transition-all duration-200`}
        >
          {type === "payment" ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              💰 New Payment
            </>
          ) : (
            <>
              <Minus className="mr-2 h-4 w-4" />
              📝 Add Debt
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader
          className={`${
            type === "payment"
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-orange-500 to-red-600"
          } text-white p-6 -m-6 mb-6 rounded-t-lg`}
        >
          <DialogTitle className="flex items-center gap-2 text-xl">
            {type === "payment" ? (
              <CreditCard className="h-5 w-5" />
            ) : (
              <DollarSign className="h-5 w-5" />
            )}
            {type === "payment"
              ? "💰 Record New Payment"
              : "📝 Add Customer Debt"}
          </DialogTitle>
          <DialogDescription className="text-white/90">
            {type === "payment"
              ? `Record a payment received from ${customerName}`
              : `Add debt for ${customerName} with detailed information`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Amount (₪) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="pl-10 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="payment_method"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Payment Method
              </Label>
              {!hidePaymentMethod && (
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">
                      🏦 Bank Transfer
                    </SelectItem>
                    <SelectItem value="check">📝 Check</SelectItem>
                    <SelectItem value="digital_wallet">
                      📱 Digital Wallet
                    </SelectItem>
                    <SelectItem value="other">🔄 Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={
                type === "payment"
                  ? "What is this payment for? (e.g., Invoice #123, Monthly payment)"
                  : "What is this debt for? (e.g., Purchase order, Service fee)"
              }
              className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Products/Items */}
          {showProductsList ? (
            <div className="space-y-2">
              <Label
                htmlFor="products"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Products/Items
              </Label>
              <Textarea
                id="products"
                value={formData.products}
                onChange={(e) =>
                  setFormData({ ...formData, products: e.target.value })
                }
                placeholder="List the products or services involved (e.g., 2x Laptop, 1x Mouse, Installation service)"
                rows={3}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
              />
              <div>
                <Link href="/dashboard/products/new">
                  <Button
                    variant="outline"
                    className="mt-2 text-blue-700 border-blue-300"
                  >
                    + Add New Product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label
                htmlFor="products"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Products/Items
              </Label>
              <Textarea
                id="products"
                value={formData.products}
                onChange={(e) =>
                  setFormData({ ...formData, products: e.target.value })
                }
                placeholder="List the products or services involved (e.g., 2x Laptop, 1x Mouse, Installation service)"
                rows={3}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-semibold text-gray-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional notes or comments about this transaction..."
              rows={3}
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Summary */}
          {formData.amount && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2">
                📋 Transaction Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Customer:</span> {customerName}
                </p>
                <p>
                  <span className="font-medium">Amount:</span> ₪
                  {Number.parseFloat(formData.amount || "0").toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {type === "payment" ? "Payment" : "Debt"}
                </p>
                {formData.payment_method && (
                  <p>
                    <span className="font-medium">Method:</span>{" "}
                    {formData.payment_method.replace("_", " ")}
                  </p>
                )}
                {formData.description && (
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="px-6 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.amount}
            className={`px-6 ${
              type === "payment"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            } text-white shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <>
                {type === "payment" ? (
                  <Plus className="mr-2 h-4 w-4" />
                ) : (
                  <Minus className="mr-2 h-4 w-4" />
                )}
                {type === "payment" ? "💰 Record Payment" : "📝 Add Debt"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
