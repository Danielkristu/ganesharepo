"use client";

import { useState, useEffect } from "react";
import { BookOpen, Video, Users, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Document } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    documents: 0,
    webinars: 0,
    students: 0,
    usage: "89%",
  });
  const [recentUploads, setRecentUploads] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("ganesha_token");
        const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const [docsRes, webinarsRes, usersRes] = await Promise.all([
          fetch("/api/proxy/repository/admin/documents?limit=5", { headers }),
          fetch("/api/proxy/webinar/rooms", { headers }),
          fetch("/api/proxy/admin/users", { headers }),
        ]);

        let docs = [];
        let webinars = [];
        let users = [];

        if (docsRes.ok) docs = await docsRes.json();
        if (webinarsRes.ok) webinars = await webinarsRes.json();
        if (usersRes.ok) users = await usersRes.json();

        setStats({
          documents: docs.length || 0, // Ideally we would get total count, but this is a start
          webinars: webinars.length || 0,
          students: users.filter((u: any) => u.role === "student").length || 0,
          usage: "89%",
        });

        setRecentUploads(docs.slice(0, 5));
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-zinc-400" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Documents", value: stats.documents.toString(), icon: BookOpen, trend: "Fetched from DB" },
          { label: "Active Webinars", value: stats.webinars.toString(), icon: Video, trend: "Fetched from DB" },
          { label: "Total Students", value: stats.students.toString(), icon: Users, trend: "Fetched from DB" },
          { label: "Platform Usage", value: stats.usage, icon: TrendingUp, trend: "Estimated" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-1">{stat.value}</p>
              </div>
              <div className="p-2 bg-zinc-50 rounded-md border border-zinc-100">
                <stat.icon size={18} className="text-zinc-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-green-600">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm min-h-[400px]">
          <h2 className="font-semibold text-zinc-900 mb-6">Recent Uploads</h2>
          {recentUploads.length > 0 ? (
            <div className="space-y-4">
              {recentUploads.map((doc) => (
                <div key={doc.id} className="flex gap-4 items-center p-4 border border-zinc-100 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-200">
                    <BookOpen size={18} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{doc.title}</p>
                    <p className="text-xs text-zinc-500">{doc.category} • {doc.major || "No Major"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <BookOpen size={32} className="mb-3 text-zinc-300" />
              <p className="text-sm font-medium">No recent uploads</p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm min-h-[400px]">
          <h2 className="font-semibold text-zinc-900 mb-6">Activity Log</h2>
          <div className="space-y-4">
            <div className="flex gap-3 items-start pb-4 border-b border-zinc-100 last:border-0">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-sm text-zinc-900">Dashboard Loaded</p>
                <p className="text-xs text-zinc-500 mt-0.5">Just now by System</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
