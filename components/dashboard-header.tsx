"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Moon, Sun, Settings, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notifications";

export function DashboardHeader() {
  const [store, setStore] = useState<Store | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    fetchStoreData();
    fetchNotifications();
  }, []);

  const fetchStoreData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error("Error fetching store data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    fetchNotifications();
    toast.success("All notifications marked as read");
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/80 px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <img
              src="/store-bag.png"
              alt="Store Icon"
              className="w-10 h-10 rounded-xl shadow-md bg-gradient-to-br from-blue-400 to-purple-500 p-1"
            />
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent dark:from-blue-200 dark:to-purple-200">
                Welcome, {store?.name || "Store"}!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                Manage your business with confidence 🚀
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu
            open={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 p-0 border-0 shadow-2xl bg-white dark:bg-gray-900"
              align="end"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-300">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                        !notification.is_read
                          ? "bg-blue-50/50 dark:bg-blue-900/30"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full shadow border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="/placeholder-store.jpg"
                    alt={store?.name || "Store"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                    {store?.name ? getInitials(store.name) : "ST"}
                  </AvatarFallback>
                  <span className="absolute bottom-0 right-0 block w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 border-2 border-white"></span>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 items-center text-center">
                  <img
                    src="/store-bag.png"
                    alt="Store Icon"
                    className="w-12 h-12 rounded-xl shadow bg-gradient-to-br from-blue-400 to-purple-500 p-1 mb-2"
                  />
                  <p className="text-base font-bold leading-none text-blue-700 dark:text-blue-200">
                    {store?.name || "Store"}
                  </p>
                  <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                    {store?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
