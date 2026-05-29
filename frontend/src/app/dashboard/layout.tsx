import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users, BookOpen, Settings, LogOut, Video, Globe, ArrowUpRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import DashboardAccessGate from "@/components/auth/DashboardAccessGate";

function readJwtRole(token: string): string | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(jsonPayload) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ganesha_token")?.value;
  const role = token ? readJwtRole(token) : null;

  if (!token) {
    redirect("/login?error=unauthorized");
  }

  if (role !== "admin") {
    redirect("/login?error=forbidden");
  }

  return (
    <DashboardAccessGate>
      <div className="min-h-screen bg-zinc-50 flex">
        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-200">
            <GraduationCap className="text-zinc-900 mr-2" size={24} />
            <span className="font-semibold text-zinc-900 tracking-tight">Admin Panel</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-100 text-zinc-900 font-medium text-sm">
              <LayoutDashboard size={18} className="text-zinc-500" />
              Overview
            </Link>
            <Link href="/dashboard/documents" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors">
              <BookOpen size={18} className="text-zinc-400" />
              Documents
            </Link>
            <Link href="/dashboard/webinars" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors">
              <Video size={18} className="text-zinc-400" />
              Webinars
            </Link>
            <Link href="/dashboard/quiz" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors">
              <ClipboardList size={18} className="text-zinc-400" />
              Quizzes
            </Link>
            <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors">
              <Users size={18} className="text-zinc-400" />
              Pengurus
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors">
              <Settings size={18} className="text-zinc-400" />
              Settings
            </Link>
          </nav>

          <div className="p-4 border-t border-zinc-200">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium text-sm transition-colors w-full">
              <LogOut size={18} className="text-zinc-400" />
              Sign Out
            </Link>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
            <h1 className="text-lg font-medium text-zinc-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-full hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
              >
                <Globe size={16} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <span>GaneRepo</span>
                <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                <span className="text-xs font-semibold text-zinc-600">AD</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardAccessGate>
  );
}
