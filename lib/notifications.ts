import { supabase } from "./supabase";

export interface Notification {
  id: string;
  store_id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
  is_read: boolean;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("email", user.email)
      .single();
    if (!store) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
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

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("store_id", store.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};

export const createNotification = async (notification: {
  title: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
}): Promise<void> => {
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

    const { error } = await supabase.from("notifications").insert([
      {
        store_id: store.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: false,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const NotificationTemplates = {
  customerAdded: (customerName: string) => ({
    title: "عميل جديد",
    message: `تم إضافة العميل ${customerName} بنجاح`,
    type: "success" as const,
  }),

  productAdded: (productName: string) => ({
    title: "منتج جديد",
    message: `تم إضافة المنتج ${productName} إلى المخزون`,
    type: "success" as const,
  }),

  orderCreated: (
    orderNumber: string,
    amount: number,
    customerName?: string
  ) => ({
    title: "طلب جديد",
    message: `تم إنشاء الطلب ${orderNumber} بقيمة ₪${amount.toLocaleString()}${
      customerName ? ` للعميل ${customerName}` : ""
    }`,
    type: "success" as const,
  }),

  invoiceCreated: (invoiceNumber: string, amount: number) => ({
    title: "فاتورة جديدة",
    message: `تم إنشاء الفاتورة ${invoiceNumber} بقيمة ₪${amount.toLocaleString()}`,
    type: "success" as const,
  }),

  paymentReceived: (amount: number, customerName?: string) => ({
    title: "دفعة مستلمة",
    message: `تم استلام دفعة بقيمة ₪${amount.toLocaleString()}${
      customerName ? ` من ${customerName}` : ""
    }`,
    type: "success" as const,
  }),

  debtAdded: (amount: number, customerName: string) => ({
    title: "دين جديد",
    message: `تم إضافة دين بقيمة ₪${amount.toLocaleString()} للعميل ${customerName}`,
    type: "warning" as const,
  }),

  lowStock: (productName: string, quantity: number) => ({
    title: "تحذير مخزون منخفض",
    message: `المنتج ${productName} أوشك على النفاد (${quantity} قطع متبقية)`,
    type: "warning" as const,
  }),

  transactionCreated: (type: string, amount: number) => ({
    title: "معاملة جديدة",
    message: `تم إنشاء معاملة ${type} بقيمة ₪${amount.toLocaleString()}`,
    type: "info" as const,
  }),

  login: (storeName: string) => ({
    title: "Login Successful",
    message: `Welcome back to ${storeName}!`,
    type: "success" as const,
  }),
};
