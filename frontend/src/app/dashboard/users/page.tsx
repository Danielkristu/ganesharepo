"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Shield, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { FacultyMember } from "@/types";

export default function PengurusPage() {
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [adminFaculty, setAdminFaculty] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("ganesha_user");
    if (raw) {
      try {
        const user = JSON.parse(raw) as { faculty?: string };
        setAdminFaculty(user.faculty || "");
      } catch {
        setAdminFaculty("");
      }
    }
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("ganesha_token");
      const res = await fetch("/api/proxy/admin/users", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.detail || "Failed to load members.");
      }
      setMembers(Array.isArray(payload) ? payload : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load members.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (email: string, role: FacultyMember["role"]) => {
    try {
      setSavingEmail(email);
      const token = localStorage.getItem("ganesha_token");
      const res = await fetch(`/api/proxy/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.detail || "Failed to update member role.");
      }

      setMembers((current) =>
        current.map((member) =>
          member.email === email ? { ...member, role } : member
        )
      );
      toast.success("Member role updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update member role.";
      toast.error(message);
    } finally {
      setSavingEmail(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => {
      const searchable = [member.email, member.major, member.faculty, member.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [members, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
            <Shield size={14} />
            Pengurus management
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-900">Faculty members</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Only users who have already logged in appear here. You can promote or demote members within {adminFaculty || "your faculty"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, major, or role"
              className="w-full lg:w-80 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:bg-white"
            />
          </div>
          <button
            onClick={fetchMembers}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900">Member list</h3>
            <p className="text-sm text-zinc-500">Profiles are created on first login, so this shows your logged-in faculty members.</p>
          </div>
          <div className="text-sm text-zinc-500 inline-flex items-center gap-2">
            <Users size={16} />
            {filteredMembers.length} members
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500">
            <Loader2 size={22} className="animate-spin mr-2" />
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-500">
            No members found for this faculty.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredMembers.map((member) => (
              <div key={member.email} className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-900 break-all">{member.email}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.role === "admin" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                      {member.role === "admin" ? "Admin" : "Student"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {member.faculty || "Unknown faculty"}{member.major ? ` • ${member.major}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.email, e.target.value as FacultyMember["role"])}
                    disabled={savingEmail === member.email}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none disabled:opacity-60"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  {savingEmail === member.email ? (
                    <Loader2 size={18} className="animate-spin text-zinc-500" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
