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
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    balance: 0,
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
        .from("customers")
        .insert([
          {
            ...formData,
            store_id: store.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await createNotification(
        NotificationTemplates.customerAdded(formData.name)
      );

      toast.success("Customer added successfully");
      router.push("/dashboard/customers");
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error(error?.message || "Error adding customer");
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
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-gray-500">Create a new customer profile</p>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
          <CardDescription className="text-green-100">
            Fill in the customer details below
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
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter customer name"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="customer@example.com"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+972-XX-XXX-XXXX"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Initial Balance */}
              <div className="space-y-2">
                <Label
                  htmlFor="balance"
                  className="text-sm font-medium text-gray-700"
                >
                  Initial Balance (₪)
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter customer address"
                  className="pl-10 min-h-[80px] border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium h-11 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? "Adding Customer..." : "Add Customer"}
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

// إذا كان هناك أي تاريخ ظاهر في الصفحة، استخدم دالة formatDate بنفس الأسلوب.
