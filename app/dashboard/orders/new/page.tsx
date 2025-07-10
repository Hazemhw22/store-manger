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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer, Product } from "@/lib/types";
import { toast } from "sonner";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    notes: "",
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category: "",
    stock_quantity: 0,
  });
  const [amountPaid, setAmountPaid] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      // Fetch customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", store.id)
        .order("name");

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("name");

      setCustomers(customersData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error loading data");
    }
  };

  const addNewProduct = async () => {
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

      const { data: product, error } = await supabase
        .from("products")
        .insert([
          {
            store_id: store.id,
            name: newProduct.name,
            price: newProduct.price,
            category: newProduct.category || null,
            stock_quantity: newProduct.stock_quantity,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add notification
      await supabase.from("notifications").insert([
        {
          store_id: store.id,
          title: "New Product Added",
          message: `Product "${newProduct.name}" has been added to inventory`,
          type: "success",
        },
      ]);

      setProducts([...products, product]);
      setNewProduct({ name: "", price: 0, category: "", stock_quantity: 0 });
      setShowNewProductDialog(false);
      toast.success("Product added successfully");
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Error adding product");
    }
  };

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_price = product.price;
        updatedItems[index].total_price =
          product.price * updatedItems[index].quantity;
      }
    }

    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total_price =
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
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

      const totalAmount = calculateTotal();
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id: store.id,
            customer_id: formData.customer_id || null,
            order_number: orderNumber,
            total_amount: totalAmount,
            status: "pending",
            // notes: formData.notes || null, // حذف حقل الملاحظات
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);
      if (itemsError) throw itemsError;

      // تسجيل دفعة ومديونية حسب المبلغ المدفوع
      if (amountPaid > 0 && formData.customer_id) {
        // Payment فقط
        await supabase.from("payments").insert([
          {
            store_id: store.id,
            customer_id: formData.customer_id,
            amount: amountPaid,
            payment_method: "order_payment",
          },
        ]);
      }
      if (amountPaid < totalAmount && formData.customer_id) {
        const debtAmount = totalAmount - amountPaid;
        // Debt فقط
        await supabase.from("payments").insert([
          {
            store_id: store.id,
            customer_id: formData.customer_id,
            amount: -debtAmount,
            payment_method: "order_debt",
          },
        ]);
      }
      // تحديث رصيد الزبون بعد كل دفعة أو دين
      if (formData.customer_id) {
        // احسب مجموع جميع الدفعات لهذا الزبون
        const { data: paymentsSum, error: paymentsSumError } = await supabase
          .from("payments")
          .select("amount")
          .eq("customer_id", formData.customer_id);
        if (!paymentsSumError && paymentsSum) {
          const balance = paymentsSum.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          );
          await supabase
            .from("customers")
            .update({ balance })
            .eq("id", formData.customer_id);
        }
      }

      // Create notification
      const customerName = customers.find(
        (c) => c.id === formData.customer_id
      )?.name;
      await createNotification(
        NotificationTemplates.orderCreated(
          orderNumber,
          totalAmount,
          customerName
        )
      );

      toast.success("Order created successfully");
      router.push("/dashboard/orders");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error?.message || "Error creating order");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Create New Order
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Add a new order with invoice
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <ShoppingCart className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-8">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 items-end p-6 bg-gray-50 rounded-xl shadow-sm"
                    >
                      <div className="col-span-4">
                        <Label className="text-sm font-semibold text-gray-700">
                          Product
                        </Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) =>
                            updateOrderItem(index, "product_id", value)
                          }
                        >
                          <SelectTrigger className="h-12 bg-white border-0 focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ₪{product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Quantity
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "quantity",
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                          className="h-12 bg-white border-0 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Unit Price
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "unit_price",
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-12 bg-white border-0 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Total
                        </Label>
                        <Input
                          value={`₪${item.total_price.toFixed(2)}`}
                          disabled
                          className="h-12 bg-gray-100 border-0"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOrderItem(index)}
                          className="h-12 w-12 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOrderItem}
                      className="flex-1 h-12 bg-transparent hover:bg-blue-50 border-blue-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>

                    <Dialog
                      open={showNewProductDialog}
                      onOpenChange={setShowNewProductDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 bg-transparent hover:bg-green-50 border-green-200 text-green-700"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          New Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-0 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Product Name</Label>
                            <Input
                              value={newProduct.name}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter product name"
                              className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newProduct.price}
                                onChange={(e) =>
                                  setNewProduct({
                                    ...newProduct,
                                    price:
                                      Number.parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder="0.00"
                                className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <Label>Stock Quantity</Label>
                              <Input
                                type="number"
                                value={newProduct.stock_quantity}
                                onChange={(e) =>
                                  setNewProduct({
                                    ...newProduct,
                                    stock_quantity:
                                      Number.parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder="0"
                                className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input
                              value={newProduct.category}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  category: e.target.value,
                                })
                              }
                              placeholder="Enter category"
                              className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewProductDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={addNewProduct}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            >
                              Add Product
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                  <CardTitle className="text-green-800 dark:text-green-200">
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <div>
                    <Label
                      htmlFor="customer"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Customer (Optional)
                    </Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customer_id: value })
                      }
                    >
                      <SelectTrigger className="h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="notes"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Order notes..."
                      rows={4}
                      className="bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ₪{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Label
                        htmlFor="amountPaid"
                        className="text-base font-semibold text-blue-700"
                      >
                        Amount Paid
                      </Label>
                      <Input
                        id="amountPaid"
                        type="number"
                        min="0"
                        max={calculateTotal()}
                        value={amountPaid}
                        onChange={(e) =>
                          setAmountPaid(Number(e.target.value) || 0)
                        }
                        className="w-40 h-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    {amountPaid < calculateTotal() && (
                      <div className="flex justify-between items-center mt-2 text-base text-orange-600">
                        <span>Remaining (Debt):</span>
                        <span>
                          ₪{(calculateTotal() - amountPaid).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Order...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Create Order
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
