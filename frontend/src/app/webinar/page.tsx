"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Calendar, Radio, Clock, ChevronRight } from "lucide-react";
import type { WebinarRoom } from "@/types";

function StatusBadge({ status }: { status: WebinarRoom["status"] }) {
  const config = {
    live: { label: "LIVE", bg: "bg-red-50", text: "text-red-600", border: "border-red-100", dot: "bg-red-500" },
    scheduled: { label: "Upcoming", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
    ended: { label: "Ended", bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-200", dot: "bg-zinc-400" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${config.dot} ${status === "live" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>
  );
}

export default function WebinarListPage() {
  const [rooms, setRooms] = useState<WebinarRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/proxy/webinar/rooms");
        if (res.ok) {
          const data: WebinarRoom[] = await res.json();
          setRooms(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200">
            <Radio size={20} className="text-zinc-700" />
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Conferences
          </h1>
        </div>
        <p className="text-zinc-500 mb-10 max-w-2xl">
          Join live academic conferences, guest lectures, and symposiums from Institut Teknologi Bandung.
        </p>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clean-card h-[180px] bg-zinc-50 border-zinc-100" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <Radio size={32} className="mx-auto text-zinc-400 mb-3" />
            <p className="text-zinc-600 font-medium">No webinars available</p>
            <p className="text-zinc-500 text-sm mt-1">Check back later for upcoming sessions.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link 
                href={`/webinar/${room.id}`} 
                key={room.id} 
                className="clean-card p-6 flex flex-col group animate-fade-up"
              >
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={room.status} />
                  <Video size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </div>

                <h2 className="font-semibold text-lg leading-snug text-zinc-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {room.title}
                </h2>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-6 flex-1">
                  {room.description}
                </p>

                <div className="pt-4 mt-auto border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-zinc-400" />
                      {new Date(room.scheduled_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} className="text-zinc-400" />
                      {new Date(room.scheduled_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-600 transition-colors group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
