export interface Store {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  store_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  balance: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  cost?: number
  stock_quantity: number
  category?: string
  barcode?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  store_id: string
  customer_id?: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  status: string
  due_date?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
}

export interface Transaction {
  id: string
  store_id: string
  customer_id?: string
  invoice_id?: string
  order_id?: string
  type: string
  amount: number
  description?: string
  created_at: string
  customer?: { name: string }
  invoice?: { invoice_number: string }
}

export interface Payment {
  id: string
  store_id: string
  customer_id?: string
  invoice_id?: string
  amount: number
  payment_method: string
  notes?: string
  created_at: string
  customer?: { name: string }
  invoice?: { invoice_number: string }
}

export interface Order {
  id: string
  store_id: string
  customer_id?: string
  order_number: string
  total_amount: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: { name: string }
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Notification {
  id: string
  store_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}
