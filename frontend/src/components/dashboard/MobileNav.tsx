"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users, BookOpen, Settings, LogOut, Video, ClipboardList, Menu, X } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/documents", label: "Documents", icon: BookOpen },
    { href: "/dashboard/webinars", label: "Webinars", icon: Video },
    { href: "/dashboard/quiz", label: "Quizzes", icon: ClipboardList },
    { href: "/dashboard/users", label: "Pengurus", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden flex items-center">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />

          {/* Drawer container */}
          <aside className="relative flex flex-col w-full max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200">
              <div className="flex items-center">
                <GraduationCap className="text-zinc-900 mr-2" size={24} />
                <span className="font-semibold text-zinc-900 tracking-tight">Admin Panel</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-zinc-500" : "text-zinc-400"} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-50 text-zinc-600 hover:text-red-600 font-medium text-sm transition-colors w-full"
              >
                <LogOut size={18} className="text-zinc-400" />
                Sign Out
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
