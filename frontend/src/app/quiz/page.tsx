"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, BookOpen, Video, ChevronRight } from "lucide-react";

interface QuizSummary {
  id: string;
  title: string;
  description: string;
  linked_name: string | null;
  linked_type: "document" | "webinar" | null;
  faculty: string | null;
  created_at: string;
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    fetch("/api/proxy/quiz/", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setQuizzes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200">
            <ClipboardList size={20} className="text-zinc-700" />
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">Quizzes</h1>
        </div>
        <p className="text-zinc-500 mb-10 max-w-xl">
          Test your understanding of lecture materials and webinars.
        </p>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-zinc-100 rounded-xl border border-zinc-200" />)}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <ClipboardList size={32} className="mx-auto text-zinc-400 mb-3" />
            <p className="text-zinc-600 font-medium">No quizzes available yet</p>
            <p className="text-zinc-500 text-sm mt-1">Check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:shadow-sm hover:border-zinc-300 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                    {quiz.title}
                  </p>
                  {quiz.linked_name && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                      {quiz.linked_type === "webinar" ? <Video size={11} /> : <BookOpen size={11} />}
                      {quiz.linked_name}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500 transition-colors ml-4 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
