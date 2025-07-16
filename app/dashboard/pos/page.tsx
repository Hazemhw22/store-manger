"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function POSPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        // Get store
        const { data: store, error: storeError } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_user_id", user.id)
          .single();
        console.log("Fetched store:", store, storeError);
        setStore(store);
        if (store) {
          fetchProducts(store.id);
        } else {
          setIsLoading(false); // <-- Add this to prevent infinite loading
        }
      }
    });
    // eslint-disable-next-line
  }, []);

  async function fetchProducts(storeId: number) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("name");
    console.log("Fetched products:", data, error);
    setProducts(data || []);
    setIsLoading(false);
  }

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: number, qty: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, qty) } : item
      )
    );
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function handleCheckout() {
    if (!store || cart.length === 0) return;
    // Create order
    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          store_id: store.id,
          total: total,
          status: "paid",
        },
      ])
      .select()
      .single();
    if (error) {
      alert("Error creating order: " + error.message);
      return;
    }
    // Create order items
    for (const item of cart) {
      await supabase.from("order_items").insert([
        {
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty,
        },
      ]);
    }
    setCart([]);
    alert("Sale completed!");
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Point of Sale</h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product List */}
        <div className="flex-1">
          <input
            className="border p-2 mb-4 w-full"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((product) => (
                <div
                  key={product.id}
                  className="border rounded p-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-gray-500">${product.price}</div>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={() => addToCart(product)}
                  >
                    Add
                  </button>
                </div>
              ))}
          </div>
        </div>
        {/* Cart */}
        <div className="w-full md:w-96 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-2">Cart</h2>
          {cart.length === 0 ? (
            <div className="text-gray-500">No items in cart.</div>
          ) : (
            <table className="w-full mb-2">
              <thead>
                <tr>
                  <th className="text-left">Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) =>
                          updateQty(item.id, Number(e.target.value))
                        }
                        className="w-12 border"
                      />
                    </td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                    <td>
                      <button
                        className="text-red-600"
                        onClick={() => removeFromCart(item.id)}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="font-bold text-lg mb-2">
            Total: ${total.toFixed(2)}
          </div>
          <button
            className="w-full bg-green-600 text-white py-2 rounded font-bold"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
} 