"use client";

import { useState, useEffect } from "react";
import {
  Video, Plus, Loader2, Calendar, Users, X, Radio,
  Play, Square, Clock, ExternalLink, Pencil
} from "lucide-react";
import { toast } from "sonner";

interface WebinarRoom {
  id: string;
  title: string;
  description?: string;
  status: "scheduled" | "live" | "ended";
  room_url?: string;
  scheduled_at: string;
  created_at: string;
}

function StatusBadge({ status }: { status: WebinarRoom["status"] }) {
  const cfg = {
    live: { label: "LIVE", cls: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-500 animate-pulse" },
    scheduled: { label: "Upcoming", cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
    ended: { label: "Ended", cls: "bg-zinc-100 text-zinc-500 border-zinc-200", dot: "bg-zinc-400" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function WebinarsDashboard() {
  const [webinars, setWebinars] = useState<WebinarRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  });

  const token = () => localStorage.getItem("ganesha_token");
  const authHeaders = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

  const fetchWebinars = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/proxy/webinar/rooms", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setWebinars(await res.json());
      else toast.error("Failed to load webinars");
    } catch {
      toast.error("Failed to load webinars");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWebinars(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!scheduledAt) { toast.error("Please set a scheduled date"); return; }

    try {
      setIsCreating(true);
      const res = await fetch("/api/proxy/webinar/rooms", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          scheduled_at: new Date(scheduledAt).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Webinar room created with Daily.co link! 🎉");
        setShowModal(false);
        setTitle(""); setDescription("");
        fetchWebinars();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to create webinar");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      setUpdatingStatus(roomId);
      const res = await fetch(`/api/proxy/webinar/rooms/${roomId}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success(`Room marked as ${newStatus}`);
        fetchWebinars();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const liveCount = webinars.filter((w) => w.status === "live").length;
  const upcomingCount = webinars.filter((w) => w.status === "scheduled").length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Webinar Rooms</h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {liveCount} live
            </span>
            <span className="text-zinc-300">·</span>
            <span>{upcomingCount} upcoming</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={16} /> Create Webinar
        </button>
      </div>

      {/* ── Webinar Cards ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : webinars.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 mb-4">
            <Video size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900">No webinar rooms yet</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            Create your first webinar room — a Daily.co link is generated automatically.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-all"
          >
            <Plus size={15} /> Create your first webinar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {webinars.map((room) => (
            <div key={room.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <StatusBadge status={room.status} />
                  {updatingStatus === room.id && (
                    <Loader2 size={16} className="animate-spin text-zinc-400" />
                  )}
                </div>
                <h3 className="font-semibold text-zinc-900 leading-snug mb-1">{room.title}</h3>
                {room.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{room.description}</p>
                )}
                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} />
                    {new Date(room.scheduled_at).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={13} /> Moderated Q&A enabled
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
                {room.room_url ? (
                  <a
                    href={room.room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                  >
                    <Radio size={14} className="text-zinc-400" />
                    Join Room
                  </a>
                ) : null}

                {/* Status controls */}
                {room.status === "scheduled" && (
                  <button
                    onClick={() => handleStatusChange(room.id, "live")}
                    disabled={!!updatingStatus}
                    title="Go Live"
                    className="p-2 rounded-lg text-green-600 bg-green-50 border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <Play size={14} />
                  </button>
                )}
                {room.status === "live" && (
                  <button
                    onClick={() => handleStatusChange(room.id, "ended")}
                    disabled={!!updatingStatus}
                    title="End webinar"
                    className="p-2 rounded-lg text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Square size={14} />
                  </button>
                )}

                {/* View in main site */}
                <a
                  href={`/webinar/${room.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View public page"
                  className="p-2 rounded-lg text-zinc-400 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Webinar Modal ───────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <Video size={17} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">New Webinar Room</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">A Daily.co room link is created automatically</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleCreate} className="px-6 py-6 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to Machine Learning"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What will be covered in this webinar?"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Scheduled date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <Video size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  A <strong>Daily.co</strong> video room link will be generated automatically. 
                  Students can join from the webinar page on your main site.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-60"
                >
                  {isCreating ? (
                    <><Loader2 size={15} className="animate-spin" /> Creating…</>
                  ) : (
                    <><Plus size={15} /> Create Webinar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
