"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Hash,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    cost: 0,
    sku: "",
    stock_quantity: 0,
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();
      if (!store) throw new Error("Store not found");

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            ...formData,
            store_id: store.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification for product added
      await createNotification(
        NotificationTemplates.productAdded(formData.name)
      );

      toast.success("Product added successfully");
      router.push("/dashboard/products");
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error?.message || "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="hover:bg-green-50"
        >
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500">
            Create a new product in your inventory
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Information
          </CardTitle>
          <CardDescription className="text-green-100">
            Fill in the product details below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Product Name *
                </Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label
                  htmlFor="sku"
                  className="text-sm font-medium text-gray-700"
                >
                  SKU
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="sku"
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="Product SKU"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="text-sm font-medium text-gray-700"
                >
                  Selling Price (₪) *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label
                  htmlFor="cost"
                  className="text-sm font-medium text-gray-700"
                >
                  Cost Price (₪)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-700"
                >
                  Initial Quantity *
                </Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_quantity: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                </Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Product category"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Product description"
                className="min-h-[100px] border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium h-11 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? "Adding Product..." : "Add Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-8 h-11 border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
