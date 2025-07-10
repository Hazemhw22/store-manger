"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    cost: 0,
    stock_quantity: 0,
    category: "",
    barcode: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProduct()
  }, [resolvedParams.id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", resolvedParams.id).single()

      if (error) throw error

      setProduct(data)
      setFormData({
        name: data.name,
        description: data.description || "",
        price: data.price,
        cost: data.cost || 0,
        stock_quantity: data.stock_quantity,
        category: data.category || "",
        barcode: data.barcode || "",
      })
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Error loading product data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          cost: formData.cost || null,
          stock_quantity: formData.stock_quantity,
          category: formData.category || null,
          barcode: formData.barcode || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id)

      if (error) throw error

      toast.success("Product updated successfully")
      router.push(`/dashboard/products/${resolvedParams.id}`)
    } catch (error: any) {
      console.error("Error updating product:", error)
      toast.error(error.message || "Error updating product")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h1>
          <p className="text-gray-600 dark:text-gray-400">Update product information</p>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="text-green-800">Product Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter product category"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Enter barcode"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                rows={3}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
