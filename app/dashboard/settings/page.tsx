"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import type { Store } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import Image from "next/image";
import { LogOut, Calendar, Phone, MapPin, User, BadgeCheck, Image as ImageIcon } from "lucide-react";

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    fetchStoreData()
    setIsPageLoading(false)
  }, [])

  const fetchStoreData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      if (error) throw error;

      setStore(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
      });
      setLogoUrl(data.logo_url || "");
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Error loading store data");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setLogoUrl(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setIsLoading(true);

    try {
      let uploadedLogoUrl = logoUrl;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${store.id}.${fileExt}`; // No leading slash
        const { error: uploadError } = await supabase.storage
          .from("store-logos")
          .upload(filePath, logoFile, { upsert: true });
        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          toast.error("Error uploading logo. Please try again.");
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage
          .from("store-logos")
          .getPublicUrl(filePath);
        uploadedLogoUrl = publicUrlData.publicUrl;
        console.log("Logo uploaded:", filePath, uploadedLogoUrl);
      }
      if (!uploadedLogoUrl) {
        uploadedLogoUrl = "/store-bag.png";
      }
      // Debug log for update
      console.log("Updating store with id:", store.id, "Data:", {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        logo_url: uploadedLogoUrl,
        updated_at: new Date().toISOString(),
      });
      const { error } = await supabase
        .from("stores")
        .update({
          name: formData.name || "",
          phone: formData.phone || "",
          address: formData.address || "",
          logo_url: uploadedLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);

      if (error) throw error;

      toast.success("Store information updated successfully");
    } catch (error: any) {
      console.error("Error updating store:", error);
      toast.error(error.message || "Error updating store information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      window.location.href = "/login"
    } catch (error: any) {
      console.error("Error logging out:", error)
      toast.error("Error logging out")
    }
  }

  if (isPageLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Profile Info */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-4">
              <User className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Store Profile</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  {store?.logo_url ? (
                    <Image
                      src={store.logo_url}
                      alt="Store Logo"
                      width={110}
                      height={110}
                      className="rounded-full border-4 border-blue-200 dark:border-blue-700 shadow-lg object-cover bg-white"
                    />
                  ) : (
                    <div className="w-[110px] h-[110px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-5xl border-4 border-blue-100 dark:border-blue-700 shadow-lg">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <span className="text-xs font-semibold">Edit</span>
                  </label>
                </div>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</span>
              </div>
              {/* Editable Fields */}
              <form onSubmit={handleUpdateStore} className="flex-1 w-full flex flex-col gap-4">
                <div>
                  <Label htmlFor="storeName" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-blue-400" /> Store Name
                  </Label>
                  <Input
                    id="storeName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value || "" })}
                    placeholder="Enter store name"
                    className="h-12 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500/20 mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="storePhone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-400" /> Phone Number
                  </Label>
                  <Input
                    id="storePhone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value || "" })}
                    placeholder="Enter phone number"
                    className="h-12 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500/20 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="storeAddress" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-400" /> Address
                  </Label>
                  <Input
                    id="storeAddress"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value || "" })}
                    placeholder="Enter address"
                    className="h-12 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500/20 mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 px-8 font-semibold text-lg rounded-lg mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
        {/* Right: Store Info & Sign Out */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Store Info</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Subscription Status:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{store?.subscription_status || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Subscription End:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{store?.subscription_end || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Created At:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{store?.created_at ? new Date(store.created_at).toLocaleDateString() : "-"}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 px-8 font-semibold text-lg rounded-lg flex items-center gap-2 justify-center"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
