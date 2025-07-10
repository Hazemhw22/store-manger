"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/types";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCustomer();
  }, [resolvedParams.id]);

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) throw error;

      setCustomer(data);
      setFormData({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        balance: data.balance,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Error loading customer data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          balance: formData.balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id);

      if (error) throw error;

      toast.success("Customer updated successfully");
      router.push(`/dashboard/customers/${resolvedParams.id}`);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.message || "Error updating customer");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!customer) {
    return <div className="text-center py-8">Customer not found</div>;
  }

  return (
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
            Edit Customer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
            Update customer information
          </p>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Users className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter customer name"
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="balance"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Balance
                </Label>
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
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter customer address"
                rows={4}
                className="bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500/20 resize-none"
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
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// إذا كان هناك أي تاريخ ظاهر في الصفحة، استخدم دالة formatDate بنفس الأسلوب.
