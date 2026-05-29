"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, BookOpen, Video, Trash2, ChevronRight, ClipboardList } from "lucide-react";

interface QuizSummary {
  id: string;
  title: string;
  description: string;
  linked_name: string | null;
  linked_type: "document" | "webinar" | null;
  is_published: boolean;
  created_at: string;
}

export default function QuizDashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    fetch("/api/proxy/quiz/admin", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setQuizzes(d) : setQuizzes([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this quiz and all student submissions?")) return;
    const token = localStorage.getItem("ganesha_token");
    await fetch(`/api/proxy/quiz/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200">
            <ClipboardList size={22} className="text-zinc-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Quizzes</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage and publish quizzes for your students.</p>
          </div>
        </div>
        <Link
          href="/dashboard/quiz/new"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <PlusCircle size={16} />
          New Quiz
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl border border-zinc-200" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <ClipboardList size={32} className="mx-auto text-zinc-400 mb-3" />
          <p className="text-zinc-600 font-medium">No quizzes yet</p>
          <p className="text-zinc-500 text-sm mt-1">
            Create your first quiz to start testing students.
          </p>
          <Link
            href="/dashboard/quiz/new"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <PlusCircle size={15} /> Create Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-medium text-zinc-900 truncate">{quiz.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${quiz.is_published ? "bg-green-50 text-green-700 border-green-100" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                    {quiz.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                {quiz.linked_name && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    {quiz.linked_type === "webinar" ? <Video size={12} /> : <BookOpen size={12} />}
                    {quiz.linked_name}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/quiz/${quiz.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  View <ChevronRight size={12} />
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
