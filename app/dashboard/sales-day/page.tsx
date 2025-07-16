"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SalesDayPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchTodaySales(user);
      }
    });
    // eslint-disable-next-line
  }, []);

  async function fetchTodaySales(user: any) {
    setIsLoading(true);
    // Get the store for this user
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_user_id", user.id)
      .single();
    if (!store) return setIsLoading(false);

    // Get today's date in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Fetch today's orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`)
      .order("created_at", { ascending: false });

    setOrders(ordersData || []);
    setIsLoading(false);
  }

  if (isLoading) return <div>Loading...</div>;

  const total = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Sales for Today</h1>
      <div className="mb-4 text-xl font-semibold">
        Total Sales: <span className="text-green-600">${total.toFixed(2)}</span>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Order #</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No sales for today.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="p-2 border">{order.id}</td>
                <td className="p-2 border">{order.customer_id || "N/A"}</td>
                <td className="p-2 border">${order.total.toFixed(2)}</td>
                <td className="p-2 border">
                  {new Date(order.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 