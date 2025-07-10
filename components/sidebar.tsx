"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ArrowUpDown,
  CreditCard,
  Settings,
  Store,
  ShoppingCart,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowUpDown },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isMobileMenuOpen = open;

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#181f2a] text-white dark:bg-[#181f2a] dark:text-white transition-transform duration-300 transform ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-[#232b3b] dark:border-[#232b3b]">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white dark:text-white">
              Store Manager
            </h1>
            {/* Close button for mobile sidebar */}
            <button
              className="ml-auto lg:hidden text-white hover:text-red-400 dark:text-white dark:hover:text-red-400"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg dark:from-blue-700 dark:to-purple-800"
                      : "text-slate-300 dark:text-slate-400 hover:bg-slate-700/50 hover:text-white dark:hover:bg-slate-800/70"
                  )}
                  onClick={onClose}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white dark:text-slate-400 dark:group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#232b3b] dark:border-[#232b3b]">
            <div className="text-xs text-slate-400 text-center dark:text-slate-500">
              © 2024 Store Manager
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
