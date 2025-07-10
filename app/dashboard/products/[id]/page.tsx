"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Edit, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { toast } from "sonner"

interface ProductDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProductDetails()
  }, [resolvedParams.id])

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", resolvedParams.id).single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error("Error fetching product details:", error)
      toast.error("حدث خطأ في تحميل بيانات المنتج")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>
  }

  if (!product) {
    return <div className="text-center py-8">المنتج غير موجود</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
            <ArrowRight className="ml-2 h-4 w-4" />
            رجوع
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">تفاصيل المنتج</p>
          </div>
        </div>
        <Link href={`/dashboard/products/${product.id}/edit`}>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 border-b">
            <CardTitle className="text-blue-800">معلومات المنتج</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-6">
            <div>
              <span className="text-sm text-gray-600">الاسم:</span>
              <p className="font-medium">{product.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">الوصف:</span>
              <p className="font-medium">{product.description || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">الفئة:</span>
              <p className="font-medium">{product.category || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">الباركود:</span>
              <p className="font-medium">{product.barcode || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-200 border-b">
            <CardTitle className="text-green-800">الأسعار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-6">
            <div>
              <span className="text-sm text-gray-600">سعر البيع:</span>
              <p className="font-medium text-lg">{product.price.toLocaleString()} ₪</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">التكلفة:</span>
              <p className="font-medium">{product.cost?.toLocaleString() || "-"} ₪</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">الربح:</span>
              <p className="font-medium text-green-600">
                {product.cost ? (product.price - product.cost).toLocaleString() : "-"} ₪
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-200 border-b">
            <CardTitle className="text-purple-800">المخزون</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <Badge
                className={`text-lg px-4 py-2 ${
                  product.stock_quantity > 10
                    ? "bg-green-100 text-green-800 border-green-300"
                    : product.stock_quantity > 0
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                <Package className="ml-2 h-4 w-4" />
                {product.stock_quantity} قطعة
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
